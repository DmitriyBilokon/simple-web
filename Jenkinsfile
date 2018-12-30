
        stage('Build') {

                echo 'Building..'
                sh 'echo $USER'
                sh 'docker build -t simple-web -f Dockerfile .'               

        }
        stage('Test') {

                echo 'Testing..' 
                def docker_result = sh (script: 'docker ps -q', returnStdout: true )
                echo '${docker_result}'
                sh 'docker stop ${docker_result}'
                sh 'docker run -d -p 80:80 simple-web'
                sh 'curl localhost:80'

        }
        stage('Deploy') {
                echo 'Deploying....'
        }
