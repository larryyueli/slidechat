# How to continue developing this application

1. Clone the repo and follow step 1-8 in [ForSysAdmin.md](ForSysAdmins.md)
2. Navigate to the root directory of the app and run `chmod u+x setup.sh && ./setup.sh`
3. To modify the APIs and other server config, take a look at `index.js` and files in `routes/`
4. To make changes to the student client, take a look at files in `client/`
5. To make changes to the instructor client, take a look at files in `instructor-client/`
6. Both clients use `create-react-app`, you can use `npm start` to start a dev server or `npm run build` to make a production build.
7. When collaborating in a team, your team members might want to use different ports to run the dev server. To avoid commit the ports into the repo, you can add a `.env.development.local` file to `client/` and `instructor-client/` (note: not in `client/src/`), and add the following lines

```
PORT=10002
REACT_APP_SERVER_URL=http://mcsapps.utm.utoronto.ca:10001
```

where the ports are of your choice. This file is ignored by git.

8. Happy coding!
