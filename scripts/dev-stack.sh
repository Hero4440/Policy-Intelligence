#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODEL="${OLLAMA_MODEL:-llama3.1}"
OLLAMA_URL="${OLLAMA_URL:-http://127.0.0.1:11434}"

OLLAMA_PID=""
SERVER_PID=""
FRONTEND_PID=""

cleanup() {
  local exit_code=$?

  if [[ -n "${FRONTEND_PID}" ]] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
  fi

  if [[ -n "${SERVER_PID}" ]] && kill -0 "${SERVER_PID}" 2>/dev/null; then
    kill "${SERVER_PID}" 2>/dev/null || true
  fi

  if [[ -n "${OLLAMA_PID}" ]] && kill -0 "${OLLAMA_PID}" 2>/dev/null; then
    kill "${OLLAMA_PID}" 2>/dev/null || true
  fi

  wait 2>/dev/null || true
  exit "${exit_code}"
}

trap cleanup EXIT INT TERM

echo "[dev-stack] repo: ${ROOT_DIR}"

if curl -fsS "${OLLAMA_URL}/api/tags" >/dev/null 2>&1; then
  echo "[dev-stack] ollama already running at ${OLLAMA_URL}"
else
  if ! command -v ollama >/dev/null 2>&1; then
    echo "[dev-stack] ollama is not running and the 'ollama' command was not found."
    echo "[dev-stack] install Ollama or start it manually, then rerun this script."
    exit 1
  fi

  echo "[dev-stack] starting ollama serve"
  (
    cd "${ROOT_DIR}"
    ollama serve
  ) &
  OLLAMA_PID=$!

  for _ in {1..20}; do
    if curl -fsS "${OLLAMA_URL}/api/tags" >/dev/null 2>&1; then
      echo "[dev-stack] ollama is ready"
      break
    fi
    sleep 1
  done

  if ! curl -fsS "${OLLAMA_URL}/api/tags" >/dev/null 2>&1; then
    echo "[dev-stack] ollama did not become ready in time"
    exit 1
  fi
fi

if ! curl -fsS "${OLLAMA_URL}/api/tags" | grep -q "\"name\":\"${MODEL}\""; then
  echo "[dev-stack] warning: model '${MODEL}' is not present locally."
  echo "[dev-stack] run: ollama pull ${MODEL}"
fi

echo "[dev-stack] starting PolicyPilot server on :3000"
(
  cd "${ROOT_DIR}"
  npm run server:dev
) &
SERVER_PID=$!

echo "[dev-stack] starting Vite frontend on :4173"
(
  cd "${ROOT_DIR}"
  npm run frontend:dev
) &
FRONTEND_PID=$!

echo "[dev-stack] ready"
echo "[dev-stack] frontend: http://localhost:4173"
echo "[dev-stack] api:      http://localhost:3000/api/health"
echo "[dev-stack] mcp:      http://localhost:3000/health"
echo "[dev-stack] ctrl+c stops everything started by this script"

wait -n "${SERVER_PID}" "${FRONTEND_PID}"
echo "[dev-stack] one process exited; shutting down"
