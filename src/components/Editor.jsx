import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import ACTIONS from "../Actions";
import { Toaster } from "react-hot-toast";

const CodeEditor = ({ socketRef, roomId, onCodeChange, selectedLanguage }) => {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const editorRef = useRef(null);

  useEffect(() => {
    if (socketRef && socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        setCode(code);
      });
    }
  }, [socketRef]);

  useEffect(() => {
    if (selectedLanguage === "js") {
      setCode(
        "console.log(`write your js code hit the compile and run button to execute`)"
      );
    }else if (selectedLanguage === "cpp") {
      setCode(
        `#include<iostream> \nusing namespace std;\n\nint main(){ \n\n //write you cpp code here   \n \n return 0;\n}`
      );
    }else if(selectedLanguage === 'java'){
        setCode(`public class Main {
          public static void main(String[] args) {
              System.out.println("Hello, Java!");
          }
      }
      `)
    }else{
      setCode('')
    }

    

   

  }, [selectedLanguage]);

  const compileCode = () => {
    axios
      .post("http://localhost:8000/compile", { code, language : selectedLanguage })
      .then((response) => {
        const { error, output } = response.data;
        if (error) {
          setOutput(`Error: ${error}`);
        } else {
          setOutput(output);
        }
      })
      .catch((error) => {
        console.error("Error compiling code:", error);
        setOutput("Error: Failed to compile code. Please try again later.");
      });
  };

  setTimeout(()=>{
    setOutput('');
  },1000*90)

  const handleCodeChange = (value) => {
    setCode(value);

    socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code: value });
    onCodeChange(value);
  };

  return (
    <>
      <Toaster />
      <div className="flex flex-col ">
        <div className="flex-grow">
          <Editor
            height="80vh"
            defaultLanguage={selectedLanguage | 'cpp'}
            theme="vs-dark"
            value={code}
            onChange={handleCodeChange}
          />
        </div>
        <div className="flex justify-between items-center bg-gray-800  text-white">
          <div className="flex-shrink-0">
            <button
              className=" ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={compileCode}
            >
              Compile and Run
            </button>
          </div>
          {/* <div className="flex-1 ml-4">
          <textarea
            className="w-full h-20 p-2 border border-gray-400 rounded focus:outline-none focus:border-blue-500"
            placeholder="Input"
          />
        </div> */}
          <div className="flex-1 ml-4 h-20">
            <h3 className="text-lg text-yellow-300 font-semibold mb-2">Output:</h3>
            <span className="text-xl text-green-500 overflow-auto   p-2">
              {output}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default CodeEditor;
