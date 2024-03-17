const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const server = http.createServer(app);
const io = new Server(server);

const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

app.use(cors());
app.use(bodyParser.json());

const userSocketMap = {};

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            userName: userSocketMap[socketId],
        }
    })
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, userName }) => {
        userSocketMap[socket.id] = userName;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);

        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, { clients, userName, socketId: socket.id });
        })
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                userName: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });

});


// routes 

app.post('/compile', (req, res) => {
    const code = req.body.code;
  
    // Save the C++ code to a file
    const fileName = 'temp.cpp';
    const fs = require('fs');
    fs.writeFileSync(fileName, code);
  
    // Run the compilation command using child_process
    const compilationCommand = `g++ ${fileName} -o output.exe`;
    exec(compilationCommand, (compileError, compileStdout, compileStderr) => {
      if (compileError) {
        res.send({ error: compileError.message, output: compileStderr });
        return;
      }
  
      // Run the compiled executable
      const executionCommand = 'output.exe';
      exec(executionCommand, (runError, runStdout, runStderr) => {
        res.send({ error: runError ? runError.message : null, output: runStdout || runStderr });
      });
    });
  });


const PORT = process.env.port || 8000;
server.listen(PORT, () => {
    console.log('server started at 8000');
})