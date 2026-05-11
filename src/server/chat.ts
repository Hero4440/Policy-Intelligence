import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { Express, Request, Response } from 'express';
import {
  compareDrugAcrossPlans,
  getChangeWatch,
  getPlanDrugDetail,
  listIssuers,
  searchDrugs
} from './policy-data.js';
import {
  appendSessionMessage,
  getOrCreateSession,
  serializeSession,
  type ChatMessage
} from './session-store.js';
import { extractPatientData } from '../mcp/fhir/extractors.js';
import { matchPatientAgainstPolicy } from '../mcp/matching/criteria_matcher.js';
import { findPolicy, findPoliciesByDrug } from '../mcp/policy_store/loader.js';
import { normalizeDrugName } from '../../data/lookup/drug-aliases.ts';
import { DISCLAIMER } from '../mcp/matching/language.js';
import { buildDoctorAgentResponse, type DoctorAgentContext } from './doctor-agent-integration.js';
import { formatDoctorAgentResponse } from './doctor-agent-output.js';
import { geminiChat, geminiStream } from './gemini-client.js';
import { getDefaultModel } from './gemini-client.js';

type ToolName =
  | 'which_plans_cover_drug'
  | 'get_plan_drug_details'
  | 'compare_drug_across_plans'
  | 'get_change_watch'
  | 'check_patient_readiness'
  | 'list_drugs'
  | 'list_issuers';

type ToolCall = {
  tool: ToolName;
  arguments?: Record<string, unknown>;
};

type PlannerResult = {
  assistant?: string;
  tool_calls?: ToolCall[];
};

type ToolExecutionResult = {
  tool: ToolName;
  args: Record<string, unknown>;
  summary: {
    title: string;
    items: string[];
  };
  data: unknown;
};

type ChatContext = {
  selectedDrug?: string;
  selectedIssuer?: string;
  selectedPlanId?: string;
  selectedPlanName?: string;
  comparePlanIds?: string[];
  comparePlanNames?: string[];
};

type ChatPayload = Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function compactMessages(messages: ChatMessage[]): string {
  return messages
    .slice(-8)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n');
}


function stripCodeFences(content: string): string {
  const trimmed = content.trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

function heuristicFallback(latestUserMessage: string, context?: ChatContext): PlannerResult {
  const lowered = latestUserMessage.toLowerCase();
  const contextualDrug = context?.selectedDrug?.trim();
  const contextualIssuer = context?.selectedIssuer?.trim();
  const contextualPlanId = context?.selectedPlanId?.trim();
  const contextualPlanName = context?.selectedPlanName?.trim();

  const drugArg = contextualDrug || latestUserMessage;
  const baseArgs = {
    drug: drugArg,
    ...(contextualIssuer ? { issuer: contextualIssuer } : {})
  };

  if (lowered.includes('ready') || lowered.includes('readiness') || lowered.includes('eligible') || lowered.includes('qualif') || lowered.includes('meets criteria')) {
    return { tool_calls: [{ tool: 'check_patient_readiness', arguments: baseArgs }] };
  }

  if (lowered.includes('change')) {
    return { tool_calls: [{ tool: 'get_change_watch', arguments: baseArgs }] };
  }

  if (lowered.includes('compare') || lowered.includes('differ')) {
    return { tool_calls: [{ tool: 'compare_drug_across_plans', arguments: baseArgs }] };
  }

  if (lowered.includes('criteria') || lowered.includes('prior auth') || lowered.includes('require')) {
    return {
      tool_calls: [{
        tool: 'get_plan_drug_details',
        arguments: {
          ...baseArgs,
          ...(contextualPlanId ? { planId: contextualPlanId } : {}),
          ...(contextualPlanName ? { planName: contextualPlanName } : {})
        }
      }]
    };
  }

  if (lowered.includes('cover')) {
    return { tool_calls: [{ tool: 'which_plans_cover_drug', arguments: baseArgs }] };
  }

  return {
    assistant: 'I can answer plan coverage, prior auth criteria, cross-plan comparison, and change-watch questions if you mention a drug or plan.'
  };
}

function formatContext(context?: ChatContext): string {
  if (!context) {
    return 'No current workspace context.';
  }

  return [
    `Selected drug: ${context.selectedDrug || 'none'}`,
    `Selected issuer: ${context.selectedIssuer || 'all issuers'}`,
    `Selected plan: ${context.selectedPlanName || context.selectedPlanId || 'none'}`,
    `Compare plans: ${context.comparePlanNames?.join(', ') || 'none'}`
  ].join('\n');
}

async function planToolUse(
  sessionId: string,
  latestUserMessage: string,
  model: string,
  context?: ChatContext
): Promise<PlannerResult> {
  const session = getOrCreateSession(sessionId);
  const plannerPrompt = [
    'You route Policy Intelligence analyst questions to deterministic tools.',
    'Return JSON only with this shape:',
    '{"assistant":"optional note","tool_calls":[{"tool":"which_plans_cover_drug","arguments":{"drug":"adalimumab"}}]}',
    'Available tools:',
    '- which_plans_cover_drug(drug, issuer?)',
    '- get_plan_drug_details(planId?, planName?, drug)',
    '- compare_drug_across_plans(drug, issuer?)',
    '- get_change_watch(drug, issuer?)',
    '- check_patient_readiness(patientId?, drug?, payer?) — check if a patient meets PA criteria',
    '- list_drugs(query?)',
    '- list_issuers()',
    'Rules:',
    '- Use comparison for questions about multiple plans or issuers.',
    '- Use plan detail for criteria questions or when a specific plan is named.',
    '- Use change watch only when the user asks about changes, updates, or version posture.',
    '- Use check_patient_readiness when user asks about readiness, eligibility, or if a patient qualifies/meets criteria.',
    '- Use the current workspace context when the user asks follow-up questions without repeating the drug or plan.',
    '- Never fabricate plan IDs or criteria. If the plan is ambiguous, use compare or list tools first.',
    '',
    `Known issuers: ${listIssuers().join(', ')}`,
    `Current workspace context:\n${formatContext(context)}`,
    `Recent conversation:\n${compactMessages(session.messages)}`,
    '',
    `Latest user message: ${latestUserMessage}`
  ].join('\n');

  const raw = await geminiChat(
    [
      { role: 'system', content: plannerPrompt },
      { role: 'user', content: latestUserMessage }
    ],
    model
  );

  return JSON.parse(stripCodeFences(raw)) as PlannerResult;
}

function inferDrug(args: Record<string, unknown>, latestUserMessage: string, context?: ChatContext): string {
  const direct = typeof args.drug === 'string' ? compactWhitespace(args.drug) : '';
  if (direct) {
    return direct;
  }

  if (context?.selectedDrug?.trim()) {
    return compactWhitespace(context.selectedDrug);
  }

  const suggested = searchDrugs(latestUserMessage, 1)[0];
  return suggested || compactWhitespace(latestUserMessage);
}

function inferIssuer(args: Record<string, unknown>, context?: ChatContext): string | undefined {
  if (typeof args.issuer === 'string' && args.issuer.trim()) {
    return compactWhitespace(args.issuer);
  }

  return context?.selectedIssuer?.trim() ? compactWhitespace(context.selectedIssuer) : undefined;
}

function resolvePlanIdFromArgs(args: Record<string, unknown>, drug: string, context?: ChatContext): string | undefined {
  if (typeof args.planId === 'string' && args.planId.trim()) {
    return compactWhitespace(args.planId);
  }

  if (context?.selectedPlanId?.trim()) {
    return compactWhitespace(context.selectedPlanId);
  }

  const planName = typeof args.planName === 'string'
    ? compactWhitespace(args.planName)
    : context?.selectedPlanName?.trim()
      ? compactWhitespace(context.selectedPlanName)
      : '';
  if (!planName) {
    return undefined;
  }

  const matches = compareDrugAcrossPlans(drug).filter((match) =>
    match.planName.toLowerCase() === planName.toLowerCase()
    || match.planId.toLowerCase() === planName.toLowerCase()
  );

  return matches[0]?.planId;
}

async function executeToolCall(toolCall: ToolCall, latestUserMessage: string, context?: ChatContext): Promise<ToolExecutionResult> {
  const args = toolCall.arguments ?? {};
  const drug = inferDrug(args, latestUserMessage, context);
  const issuer = inferIssuer(args, context);

  switch (toolCall.tool) {
    case 'list_drugs': {
      const query = typeof args.query === 'string' ? args.query : latestUserMessage;
      const drugs = searchDrugs(query);
      return {
        tool: toolCall.tool,
        args: { query },
        summary: {
          title: 'Drug suggestions',
          items: drugs
        },
        data: { drugs }
      };
    }

    case 'list_issuers': {
      const issuers = listIssuers();
      return {
        tool: toolCall.tool,
        args: {},
        summary: {
          title: 'Available issuers',
          items: issuers
        },
        data: { issuers }
      };
    }

    case 'which_plans_cover_drug': {
      const matches = compareDrugAcrossPlans(drug, issuer).filter((match) => match.coveredFlag);
      return {
        tool: toolCall.tool,
        args: { drug, issuer: issuer ?? null },
        summary: {
          title: `Plans covering ${drug}`,
          items: matches.slice(0, 12).map((match) =>
            `${match.issuerName} · ${match.planName}: ${match.coverageLabel}${match.priorAuth ? ' · PA' : ''}${match.stepTherapy ? ' · ST' : ''}`
          )
        },
        data: { drug, matches }
      };
    }

    case 'compare_drug_across_plans': {
      const matches = compareDrugAcrossPlans(drug, issuer);
      return {
        tool: toolCall.tool,
        args: { drug, issuer: issuer ?? null },
        summary: {
          title: `Cross-plan comparison for ${drug}`,
          items: matches.slice(0, 12).map((match) =>
            `${match.issuerName} · ${match.planName}: ${match.coverageLabel}${match.priorAuth ? ' · PA' : ''}${match.stepTherapy ? ' · ST' : ''}`
          )
        },
        data: { drug, matches }
      };
    }

    case 'get_change_watch': {
      const changeWatch = getChangeWatch(drug, issuer);
      return {
        tool: toolCall.tool,
        args: { drug, issuer: issuer ?? null },
        summary: {
          title: `Change watch for ${drug}`,
          items: changeWatch.notableSignals
        },
        data: changeWatch
      };
    }

    case 'check_patient_readiness': {
      const session = getOrCreateSession('');  // We'll get session from context
      const patientId = typeof args.patientId === 'string' ? args.patientId.trim() : '';
      const payer = typeof args.payer === 'string' ? args.payer.trim() : inferIssuer(args, context) || '';
      const drugForReadiness = inferDrug(args, latestUserMessage, context);
      const genericDrug = normalizeDrugName(drugForReadiness);

      // Try to find a matching policy
      const policy = payer
        ? findPolicy(payer, genericDrug)
        : findPoliciesByDrug(genericDrug)[0];

      if (!policy) {
        return {
          tool: toolCall.tool,
          args: { drug: drugForReadiness, payer },
          summary: {
            title: `No structured policy found for ${drugForReadiness}`,
            items: ['Cannot check readiness without a structured policy. Try a different drug or payer.']
          },
          data: { error: 'no_policy_found', drug: drugForReadiness, payer }
        };
      }

      // Check for uploaded patient in the session, or use demo patients
      let patientBundle: any = null;
      let patientName = 'Unknown';

      // Try uploaded patient from session context
      const chatSessionId = typeof args.sessionId === 'string' ? args.sessionId : '';
      if (chatSessionId) {
        const chatSession = getOrCreateSession(chatSessionId);
        if (chatSession.uploadedPatient) {
          patientBundle = chatSession.uploadedPatient.bundle;
          patientName = chatSession.uploadedPatient.summary;
        }
      }

      // Fall back to demo patients
      if (!patientBundle) {
        const demoPatients = [
          { id: 'patient-01', file: 'patient-01-full-match.json', name: 'Sarah Anderson', payer: 'UHC' },
          { id: 'patient-02', file: 'patient-02-partial-match.json', name: 'Michael Chen', payer: 'UHC' },
          { id: 'patient-03', file: 'patient-03-poor-match.json', name: 'Linda Washington', payer: 'Aetna' }
        ];

        // Match by patientId or by payer
        const match = patientId
          ? demoPatients.find(p => p.id === patientId || p.name.toLowerCase().includes(patientId.toLowerCase()))
          : demoPatients.find(p => p.payer.toLowerCase() === payer.toLowerCase()) || demoPatients[0];

        if (match) {
          try {
            const bundlePath = join(dirname(fileURLToPath(import.meta.url)), '../../data/patients/demo-patients', match.file);
            patientBundle = JSON.parse(readFileSync(bundlePath, 'utf-8'));
            patientName = match.name;
          } catch {
            // Fall through
          }
        }
      }

      if (!patientBundle) {
        return {
          tool: toolCall.tool,
          args: { drug: drugForReadiness, payer },
          summary: {
            title: 'No patient data available',
            items: ['Upload a FHIR patient bundle or specify a demo patient (Sarah Anderson, Michael Chen, Linda Washington).']
          },
          data: { error: 'no_patient', drug: drugForReadiness, payer }
        };
      }

      const patientData = extractPatientData(patientBundle);
      const results = matchPatientAgainstPolicy(patientData, policy);
      const matchCount = results.filter(r => r.status === 'appears_to_match').length;
      const total = results.length;

      return {
        tool: toolCall.tool,
        args: { drug: drugForReadiness, payer: policy.payer, patient: patientName },
        summary: {
          title: `Readiness: ${patientName} for ${policy.drug.brandName} (${policy.payer})`,
          items: [
            `${matchCount}/${total} criteria appear met`,
            ...results.map(r => `${r.category}: ${r.criterion} — ${r.status.replace(/_/g, ' ')}`),
            DISCLAIMER
          ]
        },
        data: {
          patient: patientName,
          drug: drugForReadiness,
          payer: policy.payer,
          plan: policy.plan,
          criteriaResults: results,
          summary: { met: matchCount, total, pct: total > 0 ? Math.round((matchCount / total) * 100) : 0 }
        }
      };
    }

    case 'get_plan_drug_details': {
      const planId = resolvePlanIdFromArgs(args, drug, context);
      if (!planId) {
        const matches = compareDrugAcrossPlans(drug, issuer);
        if (matches.length === 1) {
          const detail = getPlanDrugDetail(matches[0].planId, drug);
          if (!detail) {
            throw new Error('No plan detail found');
          }
          return {
            tool: toolCall.tool,
            args: { drug, planId: matches[0].planId },
            summary: {
              title: `${detail.issuerName} detail for ${drug}`,
              items: [
                detail.coverageLabel,
                ...detail.requirementsSummary.slice(0, 6)
              ]
            },
            data: detail
          };
        }

        return {
          tool: toolCall.tool,
          args: { drug, planId: null },
          summary: {
            title: `Need a specific plan for ${drug}`,
            items: matches.slice(0, 8).map((match) => `${match.planId} · ${match.planName}`)
          },
          data: { drug, matches }
        };
      }

      const detail = getPlanDrugDetail(planId, drug);
      if (!detail) {
        throw new Error(`No detail found for ${planId} and ${drug}`);
      }

      return {
        tool: toolCall.tool,
        args: { drug, planId },
        summary: {
          title: `${detail.issuerName} detail for ${drug}`,
          items: [
            detail.coverageLabel,
            ...detail.requirementsSummary.slice(0, 6)
          ]
        },
        data: detail
      };
    }
  }
}

function sseWrite(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function streamFinalAnswer(
  res: Response,
  sessionId: string,
  latestUserMessage: string,
  toolResults: ToolExecutionResult[],
  plannerAssistant: string | undefined,
  model: string,
  context?: ChatContext
) {
  const session = getOrCreateSession(sessionId);
  const promptMessages: ChatPayload = [
    {
      role: 'system',
      content: [
        'You are a healthcare policy intelligence assistant that analyzes insurance coverage decisions based on real medical policies and patient data.',
        '',
        'When answering coverage questions, ALWAYS follow this exact format:',
        '',
        '### 1. Coverage Status (First Line)',
        'State clearly: "COVERED", "COVERED WITH PRIOR AUTHORIZATION", "NOT COVERED", or "REQUIRES ADDITIONAL INFORMATION".',
        'Include payer name and plan tier if available.',
        '',
        '### 2. Eligibility Checklist',
        'List all requirements from the policy. For each:',
        '- Use ✅ if patient meets requirement',
        '- Use ⚠️ if conditional/requires action',
        '- Use ❌ if not met',
        '',
        '### 3. Financial Information',
        'Include copay amounts, coinsurance, annual limits, or quantity restrictions if available.',
        '',
        '### 4. Next Steps (Role-Specific)',
        'Provide 2-3 actionable items for doctors, patients, or pharmacists.',
        '',
        '### 5. Evidence Citation',
        'Always cite: policy title, page numbers, effective date, and relevant sections.',
        '',
        'CRITICAL RULES:',
        '- Only use provided tool results. Do not invent policy requirements or patient data.',
        '- Be specific: use real numbers (e.g., "LVEF 55% meets requirement of ≥50%").',
        '- If information is missing, state "Not available in our system" rather than guessing.',
        '- Keep responses scannable with bullets and visual symbols (✅ ⚠️ ❌).',
        '- Include disclaimers for ambiguous policy language.'
      ].join('\n')
    },
    {
      role: 'user',
      content: [
        `User question: ${latestUserMessage}`,
        plannerAssistant ? `Planner note: ${plannerAssistant}` : '',
        `Current workspace context:\n${formatContext(context)}`,
        'Recent conversation:',
        compactMessages(session.messages),
        'Tool results JSON:',
        JSON.stringify(toolResults.map((result) => ({
          tool: result.tool,
          args: result.args,
          data: result.data
        })), null, 2)
      ].filter(Boolean).join('\n\n')
    }
  ];

  const readableStream = await geminiStream(promptMessages, model);
  const reader = readableStream.getReader();
  let assistantText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        assistantText += value;
        sseWrite(res, 'message_delta', { delta: value });
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (assistantText) {
    appendSessionMessage(sessionId, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: assistantText
    });
    sseWrite(res, 'message_done', { message: assistantText });
  }
}

export function registerChatRoutes(app: Express) {
  app.get('/api/session/:id', (req: Request, res: Response) => {
    const session = getOrCreateSession(String(req.params.id));
    res.json({
      session: serializeSession(session),
      messages: session.messages
    });
  });

  app.post('/api/chat/doctor-agent', async (req: Request, res: Response) => {
    const { sessionId, messages, model, context } = req.body as {
      sessionId?: string;
      messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
      model?: string;
      context?: ChatContext;
    };

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    const latestUserMessage = messages?.filter((message) => message.role === 'user').at(-1)?.content?.trim();
    if (!latestUserMessage) {
      res.status(400).json({ error: 'A user message is required' });
      return;
    }

    appendSessionMessage(sessionId, {
      id: crypto.randomUUID(),
      role: 'user',
      content: latestUserMessage
    });

    const selectedModel = model?.trim() || getDefaultModel();

    try {
      let plannerResult: PlannerResult;
      try {
        plannerResult = await planToolUse(sessionId, latestUserMessage, selectedModel, context);
      } catch {
        plannerResult = heuristicFallback(latestUserMessage, context);
      }

      const toolResults: ToolExecutionResult[] = [];
      for (const toolCall of plannerResult.tool_calls ?? []) {
        const result = await executeToolCall(toolCall, latestUserMessage, context);
        toolResults.push(result);
        appendSessionMessage(sessionId, {
          id: crypto.randomUUID(),
          role: 'tool',
          content: JSON.stringify({
            tool: result.tool,
            args: result.args,
            data: result.data
          })
        });
      }

      // Build structured doctor agent response
      const doctorAgentContext: DoctorAgentContext = {
        userMessage: latestUserMessage,
        toolResults,
        payer: context?.selectedIssuer,
        drug: context?.selectedDrug
      };

      const response = buildDoctorAgentResponse(doctorAgentContext);
      res.json(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/chat/doctor-agent/markdown', async (req: Request, res: Response) => {
    const { sessionId, messages, model, context } = req.body as {
      sessionId?: string;
      messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
      model?: string;
      context?: ChatContext;
    };

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    const latestUserMessage = messages?.filter((message) => message.role === 'user').at(-1)?.content?.trim();
    if (!latestUserMessage) {
      res.status(400).json({ error: 'A user message is required' });
      return;
    }

    appendSessionMessage(sessionId, {
      id: crypto.randomUUID(),
      role: 'user',
      content: latestUserMessage
    });

    const selectedModel = model?.trim() || getDefaultModel();

    try {
      let plannerResult: PlannerResult;
      try {
        plannerResult = await planToolUse(sessionId, latestUserMessage, selectedModel, context);
      } catch {
        plannerResult = heuristicFallback(latestUserMessage, context);
      }

      const toolResults: ToolExecutionResult[] = [];
      for (const toolCall of plannerResult.tool_calls ?? []) {
        const result = await executeToolCall(toolCall, latestUserMessage, context);
        toolResults.push(result);
        appendSessionMessage(sessionId, {
          id: crypto.randomUUID(),
          role: 'tool',
          content: JSON.stringify({
            tool: result.tool,
            args: result.args,
            data: result.data
          })
        });
      }

      // Build structured doctor agent response
      const doctorAgentContext: DoctorAgentContext = {
        userMessage: latestUserMessage,
        toolResults,
        payer: context?.selectedIssuer,
        drug: context?.selectedDrug
      };

      const response = buildDoctorAgentResponse(doctorAgentContext);
      const markdown = formatDoctorAgentResponse(response);

      res.type('text/markdown').send(markdown);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    const { sessionId, messages, model, context } = req.body as {
      sessionId?: string;
      messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
      model?: string;
      context?: ChatContext;
    };

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    const latestUserMessage = messages?.filter((message) => message.role === 'user').at(-1)?.content?.trim();
    if (!latestUserMessage) {
      res.status(400).json({ error: 'A user message is required' });
      return;
    }

    appendSessionMessage(sessionId, {
      id: crypto.randomUUID(),
      role: 'user',
      content: latestUserMessage
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const selectedModel = model?.trim() || getDefaultModel();

    try {
      let plannerResult: PlannerResult;
      try {
        plannerResult = await planToolUse(sessionId, latestUserMessage, selectedModel, context);
      } catch {
        plannerResult = heuristicFallback(latestUserMessage, context);
      }

      const toolResults: ToolExecutionResult[] = [];
      for (const toolCall of plannerResult.tool_calls ?? []) {
        const result = await executeToolCall(toolCall, latestUserMessage, context);
        toolResults.push(result);
        appendSessionMessage(sessionId, {
          id: crypto.randomUUID(),
          role: 'tool',
          content: JSON.stringify({
            tool: result.tool,
            args: result.args,
            data: result.data
          })
        });
        sseWrite(res, 'tool_result', result);
      }

      await streamFinalAnswer(
        res,
        sessionId,
        latestUserMessage,
        toolResults,
        plannerResult.assistant,
        selectedModel,
        context
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown chat error';
      sseWrite(res, 'error', { message });
    } finally {
      res.end();
    }
  });
}
