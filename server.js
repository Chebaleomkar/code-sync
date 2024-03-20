const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const server = http.createServer(app);
const io = new Server(server);
const fs = require('fs')
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
    
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
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
    const { code, language } = req.body;
    console.log(code )
    console.log(language)
    let fileName, compilationCommand, executionCommand;

    if (language === 'cpp') {
        fileName = 'temp.cpp';
        compilationCommand = `g++ ${fileName} -o output.exe`;
        executionCommand = './output.exe';
    } else if (language === 'js') {
        fileName = 'temp.js';
        compilationCommand = ''; // No compilation needed for JavaScript
        executionCommand = `node ${fileName}`;
    } else {
        res.status(400).send({ error: 'Unsupported language' });
        return;
    }

    // Save the code to a file
    fs.writeFileSync(fileName, code);

    if (compilationCommand) {
        // Run the compilation command
        exec(compilationCommand, (compileError, compileStdout, compileStderr) => {
            if (compileError) {
                res.status(400).send({ error: compileError.message, output: compileStderr });
                return;
            }
            // Run the compiled executable or JavaScript file
            exec(executionCommand, (runError, runStdout, runStderr) => {
                res.send({ error: runError ? runError.message : null, output: runStdout || runStderr });

                // Delete the temporary file after execution
                fs.unlinkSync(fileName);
                if (language === 'cpp') {
                    fs.unlinkSync('output.exe');
                }
            });
        });
    } else {
        // For JavaScript, directly run the file without compilation
        exec(executionCommand, (runError, runStdout, runStderr) => {
            res.send({ error: runError ? runError.message : null, output: runStdout || runStderr });

            // Delete the temporary JavaScript file after execution
            fs.unlinkSync(fileName);
        });
    }
});


const PORT = process.env.port || 8000;
server.listen(PORT, () => {
    console.log('server started at 8000');
})