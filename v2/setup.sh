npm i
cd client && npm i && cd ..
cd instructor-client && npm i && cd ..

# default location to store pdf files
mkdir -p ~/.slidechat/files

npm run build

npm run deploy
