import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { v4 as uuIdv4 } from "uuid";

const Home = () => {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");

  const navigate = useNavigate();

  const createNewRomm = (e) => {
    e.preventDefault();
    const id = uuIdv4();
    setRoomId(id);
    // toast.success("New Room created")
  };

  const handleJoin =()=>{
    if(!roomId){
        toast.error('Room Id Required');
        return;
    }
    if(!userName){
        toast.error("UserName is Rquired");
        return;
    }
    navigate(`/editor/${roomId}` , {state :{userName }});
  }

  const handleInputEnter = (e)=>{
    if(e.code === 'Enter'){
        handleJoin();
    }
  }

  return (
    <>
     <Toaster   position="top-right" toastOptions={{duration:3000}} />
    <div className="homePageWrapper">
      <div className="formWrapper">
        <img
          className="homePageLogo"
          src="/code-sync.png"
          alt="code-sync-logo"
        />
        <h4 className="mainLabel">Paste invitation ROOM ID</h4>
        <div className="inputGroup">
          <input
            type="text"
            className="inputBox"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyUp={handleInputEnter}
          />
          <input
            type="text"
            className="inputBox"
            placeholder="UserName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyUp={handleInputEnter}
          />
          <button 
          onClick={handleJoin}
          className="btn joinBtn" 
          
          >Join</button>
          <span className="createInfo">
            If you don't have an invite then create &nbsp;
            <a href="" onClick={createNewRomm}>
              new room
            </a>
          </span>
        </div>
      </div>
      <footer>
        <h4>
          Built with 💛&nbsp; by &nbsp;
          <a href="https://github.com/Chebaleomkar">omkar chebale </a>
        </h4>
      </footer>
    </div>
    </>
  );
};

export default Home;
