pipeline {
    agent any

    environment {
        E2E_BASE_URL = 'https://mn.fcs.baimly.dev'
        DOCKER_CLI_PATH = '/usr/local/bin/docker'
        DOCKER_IMAGE = 'mcr.microsoft.com/playwright:v1.55.0-jammy'
    }

    stages {
        stage('Run E2E Tests') {
            steps {
                echo "🚀 Running Playwright E2E Tests against ${env.E2E_BASE_URL}..."

                sh """
                    ${DOCKER_CLI_PATH} pull ${DOCKER_IMAGE}
                """

                // 🔐 Подключаем секретный auth-файл
                withCredentials([file(credentialsId: 'PLAYWRIGHT_CI_AUTH_FILE', variable: 'AUTH_FILE')]) {
                    sh '''
                        echo "🔍 Проверяем, существует ли файл: $AUTH_FILE"
                        if [ ! -f "$AUTH_FILE" ]; then
                          echo "❌ Файл не найден!"
                          exit 1
                        fi

                        echo "📋 Содержимое каталога с файлом:"
                        ls -la $(dirname "$AUTH_FILE")

                        echo "🚀 Запускаем контейнер..."
                        CONTAINER_ID=$(${DOCKER_CLI_PATH} run -d \
                            -v "$(pwd):/app" \
                            -w /app \
                            -e PLAYWRIGHT_BASE_URL=''' + env.E2E_BASE_URL + ''' \
                            ''' + env.DOCKER_IMAGE + ''' tail -f /dev/null)

                        echo "🔐 Копируем файл в контейнер..."
                        ${DOCKER_CLI_PATH} cp "$AUTH_FILE" $CONTAINER_ID:/app/tests/auth/ci-auth-long-life.json

                        echo "▶️ Запускаем тесты..."
                        ${DOCKER_CLI_PATH} exec $CONTAINER_ID bash -c "
                            npm ci &&
                            npx playwright test --project=chromium
                        "

                        echo "🧹 Останавливаем контейнер..."
                        ${DOCKER_CLI_PATH} stop $CONTAINER_ID
                    '''
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline finished. Status: ${currentBuild.result}"
        }
        success {
            echo '✅ E2E Tests PASSED!'
        }
        failure {
            echo '❌ E2E Tests FAILED! Check console output for errors.'
        }
    }
}
