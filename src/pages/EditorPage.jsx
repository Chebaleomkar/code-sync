import React, { useState, useRef, useEffect } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import Client from "../components/Client";
import CodeEditor from "../components/Editor";
import { initSocket } from "../socket";
import ACTIONS from "../Actions";
import toast, { Toaster } from "react-hot-toast";

const EditorPage = () => {
  const socketRef = useRef(null);

  const [clients, setClients] = useState([]);

  const location = useLocation();
  const reactNavigator = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect-error", (err) => handleErrors(err));
      socketRef.current.on("connect-failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log(`socket error`, e);
        toast.error("socket connection failed, try again later.");
        reactNavigator("/");
      }

      if(socketRef.current){
      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        userName: location.state?.userName,
      });

      //   listening for Joined
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, userName, socketId }) => {
          if (userName !== location.state?.userName) {
            toast.success(`${userName} joined the room`);
            console.log(`${userName} joined`);
          }
          setClients(clients);
        }
      );
    };

    socketRef.current.on(ACTIONS.DISCONNECTED , ({socketId , userName})=>{
        toast.success(`${userName} left the room`)
        setClients((prev)=>{ return prev.filter(client => client.socketId !== socketId)});
    });
}
    init();
  }, [location.state, roomId, reactNavigator]);

  const copyRoomId = () => {};

  const leaveRoom = () => {};

  if (!location.state) {
    return <Navigate to="/" />;
  }
  return (
    <>
    <Toaster   position="top-right" toastOptions={{duration:3000}} />
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <img className="logoImage" src="/code-sync.png" alt="logo" />
          </div>
          <h3>Connected</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client key={client.socketId} userName={client.userName} />
            ))}
          </div>
        </div>
        <button className="btn copyBtn" onClick={copyRoomId}>
          Copy ROOM ID
        </button>
        <button className="btn leaveBtn" onClick={leaveRoom}>
          Leave
        </button>
      </div>
      <div className="editorWrap">
        <CodeEditor />
      </div>
    </div>
    </>
  );
};

export default EditorPage;
