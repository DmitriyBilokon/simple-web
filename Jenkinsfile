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
                        sh "docker stop $docker_result"
                }
                catch (error){
          
                }
                sh 'docker run -d -p 4000:80 simple-web'
                def result
                try{
                        result = sh returnStatus: true, script: 'curl -v localhost:4000'
                }
                catch (error){
          
                }
                echo "$result"
                if (result == 18){
                        echo "test ok"
                }
                else{
                        echo "test nok"
                        throw "test nok"
                }
        }
        stage('Deploy') {
                echo 'Deploying....'
        }
}
