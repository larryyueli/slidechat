cd client
npm i
npm run build

cd ../instructor-client
npm i
npm run build

cd ../server
npm i

# default location to store pdf files
mkdir -p ~/.slidechat/files

mkdir client-build
cp ../client/build/* client-build/
mkdir instructor-client-build
cp ../instructor-client/* instructor-client-build/

npm start
