/**
 * React Hook for File Service
 */

import { useState, useEffect, useCallback } from 'react';
import { getFileServiceClient, FileServiceClient } from './ws-client';

export interface FileServiceStatus {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export function useFileService() {
  const [status, setStatus] = useState<FileServiceStatus>({
    connected: false,
    connecting: false,
    error: null
  });
  
  const [client] = useState<FileServiceClient>(() => getFileServiceClient());
  
  // 连接到服务
  const connect = useCallback(async () => {
    if (status.connected || status.connecting) return;
    
    setStatus({ connected: false, connecting: true, error: null });
    
    try {
      await client.connect();
      setStatus({ connected: true, connecting: false, error: null });
    } catch (error) {
      setStatus({ 
        connected: false, 
        connecting: false, 
        error: error instanceof Error ? error.message : '连接失败' 
      });
    }
  }, [client, status.connected, status.connecting]);
  
  // 断开连接
  const disconnect = useCallback(() => {
    client.disconnect();
    setStatus({ connected: false, connecting: false, error: null });
  }, [client]);
  
  // 读取文件
  const readFile = useCallback(async (path: string) => {
    if (!status.connected) {
      throw new Error('Not connected to file service');
    }
    return await client.readFile(path);
  }, [client, status.connected]);
  
  // 写入文件
  const writeFile = useCallback(async (path: string, content: string) => {
    if (!status.connected) {
      throw new Error('Not connected to file service');
    }
    await client.writeFile(path, content);
  }, [client, status.connected]);
  
  // 编辑文件
  const editFile = useCallback(async (path: string, oldString: string, newString: string) => {
    if (!status.connected) {
      throw new Error('Not connected to file service');
    }
    await client.editFile(path, oldString, newString);
  }, [client, status.connected]);
  
  // 列出文件
  const listFiles = useCallback(async (directory: string, pattern?: string) => {
    if (!status.connected) {
      throw new Error('Not connected to file service');
    }
    return await client.listFiles(directory, pattern);
  }, [client, status.connected]);
  
  // 运行命令
  const runCommand = useCallback(async (command: string, cwd?: string) => {
    if (!status.connected) {
      throw new Error('Not connected to file service');
    }
    return await client.runCommand(command, cwd);
  }, [client, status.connected]);
  
  // 自动连接
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return {
    status,
    connect,
    disconnect,
    readFile,
    writeFile,
    editFile,
    listFiles,
    runCommand
  };
}
