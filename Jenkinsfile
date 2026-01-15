pipeline {
  agent any

  environment {
    PLAYWRIGHT_BASE_URL = 'https://mn.alarify.dev'
    PW_IMAGE = 'mcr.microsoft.com/playwright:v1.55.0-jammy'
    TESTS_REPO = 'https://github.com/alarify-io/fcs-test.git'
    TESTS_BRANCH = 'main'
  }

  stages {
    stage('UI Tests (Playwright)') {
      agent {
        docker {
          image "${PW_IMAGE}"
          args "-u root"
          reuseNode true
        }
      }

      steps {
        sh 'node -v && npm -v'

        // clone tests repo into subfolder inside workspace
        dir('fcs-test') {
          checkout([
            $class: 'GitSCM',
            branches: [[name: "*/${TESTS_BRANCH}"]],
            userRemoteConfigs: [[
              url: "${TESTS_REPO}",
              credentialsId: 'GITHUB_API_PAT_API'
            ]]
          ])

          withCredentials([file(credentialsId: 'PLAYWRIGHT_CI_AUTH_FILE', variable: 'AUTH_FILE')]) {
            sh '''
              set -euo pipefail

              mkdir -p tests/auth
              cp "$AUTH_FILE" tests/auth/ci-auth-long-life.json

              if [ -f package-lock.json ]; then
                npm ci
              else
                npm install --no-audit --no-fund
              fi

              npx playwright test --project=chromium \
                tests/conversion.spec.ts \
                tests/discard.spec.ts \
                tests/manufacture.spec.ts \
                tests/supply.spec.ts \
                tests/transfer.spec.ts
            '''
          }
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'fcs-test/playwright-report/**', allowEmptyArchive: true
      archiveArtifacts artifacts: 'fcs-test/test-results/**', allowEmptyArchive: true
      junit testResults: 'fcs-test/test-results/junit.xml', allowEmptyResults: true
    }
  }
}