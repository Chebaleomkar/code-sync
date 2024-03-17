import React, { useState } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";

const CodeEditor = ({ socketRef , roomId, onCodeChange   }) => {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");

  const compileCode = () => {
    axios
      .post("http://localhost:8000/compile", { code })
      .then((response) => {
        setOutput(response.data); // Directly set the response.data
      })
      .catch((error) => {
        console.error("Error compiling code:", error);
      });
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-grow">
        <Editor
          height="90vh"
          defaultLanguage="cpp"
          theme="vs-code"
          onChange={(value) => setCode(value)}
        />
      </div>
      <div className="flex justify-between items-center bg-gray-800 p-4 text-white">
        <div className="flex-shrink-0">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={compileCode}
          >
            Compile and Run
          </button>
        </div>
        <div className="flex-1 ml-4">
          <textarea
            className="w-full h-20 p-2 border border-gray-400 rounded focus:outline-none focus:border-blue-500"
            placeholder="Input"
          />
        </div>
        <div className="flex-1 ml-4">
          <h3 className="text-lg font-semibold mb-2">Output:</h3>
          <pre className="text-md overflow-auto">{output.output}</pre>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
