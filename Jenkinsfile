node('master'){
        stage('Build') {

                echo 'Building..'
                sh 'echo $USER'
                sh 'docker build -t simple-web -f Dockerfile .'               

        }
        stage('Test') {

                echo 'Testing..' 
                docker_result = sh returnStdout: true, script: 'docker ps -q'
                echo "$docker_result"
                try{
                        sh 'docker stop ${docker_result}'
                }
                catch (error){
          
                }
                sh 'docker run -d -p 80:80 simple-web'
                sh 'curl localhost:80'

        }
        stage('Deploy') {
                echo 'Deploying....'
        }
}
