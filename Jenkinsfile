pipeline {
  agent any

  environment {
    E2E_BASE_URL = 'https://mn.alarify.dev'
    DOCKER_IMAGE = 'mcr.microsoft.com/playwright:v1.55.0-jammy'
  }

  stages {
    stage('Run Playwright in container') {
      steps {
        withCredentials([file(credentialsId: 'PLAYWRIGHT_CI_AUTH_FILE', variable: 'AUTH_FILE')]) {
          sh '''#!/usr/bin/env bash
set -euo pipefail

docker pull "$DOCKER_IMAGE"

CONTAINER_ID="$(docker run -d --ipc=host \
  -v "$PWD:/app" -w /app \
  -e PLAYWRIGHT_BASE_URL="$E2E_BASE_URL" \
  "$DOCKER_IMAGE" tail -f /dev/null)"

cleanup() {
  docker rm -f "$CONTAINER_ID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "📦 Copy auth state..."
docker exec "$CONTAINER_ID" mkdir -p /app/tests/auth
docker cp "$AUTH_FILE" "$CONTAINER_ID:/app/tests/auth/ci-auth-long-life.json"

echo "📦 npm ci..."
docker exec "$CONTAINER_ID" bash -lc "npm ci"

echo "🧪 Run ONLY selected specs..."
docker exec "$CONTAINER_ID" bash -lc '
  npx playwright test --project=chromium \
    tests/conversion.spec.ts \
    tests/discard.spec.ts \
    tests/manufacture.spec.ts \
    tests/supply.spec.ts \
    tests/transfer.spec.ts
'
'''
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
      archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true
      junit 'test-results/junit.xml'
    }
  }
}