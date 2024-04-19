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
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const socketRef = useRef(null);
  const codeRef = useRef(null);

  const [clients, setClients] = useState([]);
  const location = useLocation();
  const reactNavigator = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      if (socketRef.current) {
        socketRef.current.emit(ACTIONS.JOIN, {
          roomId,
          userName: location.state?.userName,
        });

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

        socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, userName }) => {
          toast.success(`${userName} left the room`);
          setClients((prev) =>
            prev.filter((client) => client.socketId !== socketId)
          );
        });
      }
    };
    init();
  }, [location.state, roomId, reactNavigator]);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to your clipboard");
    } catch (err) {
      toast.error("Could not copy the Room ID");
      console.error(err);
    }
  };

  const leaveRoom = () => {
    reactNavigator("/");
  };

  if (!location.state) {
    return <Navigate to="/" />;
  }

  const handleChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  const languageSupported = ['javascript' , 'java' , 'cpp']

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="mainWrap">
        <div className="aside">
          <div className="asideInner">
            <div className="logo">
              <img className="logoImage" src="/code-sync.png" alt="logo" />
            </div>
            {/* select language */}
            <div className="w-full flex flex-col items-center justify-center">
              <label htmlFor="language" className="text-white text-sm mb-2">
                Select a language:
              </label>
              <select
                id="language"
                value={selectedLanguage}
                onChange={handleChange}
                className="w-full p-2 text-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select language to code</option>
                {languageSupported.map((item , index)=>(
                  <option value={item} className="text-green-500">
                    {item}
                  </option>
                ))}
                
              </select>

              {selectedLanguage && (
                <p className="mt-2 text-md text-emerald-400 ">
                  You selected: {selectedLanguage}
                </p>
              )}
            </div>

            <br />
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
          <CodeEditor
            socketRef={socketRef}
            roomId={roomId}
            onCodeChange={(code) => {
              codeRef.current = code;
            }}
            selectedLanguage={selectedLanguage}
          />
        </div>
      </div>
    </>
  );
};

export default EditorPage;
