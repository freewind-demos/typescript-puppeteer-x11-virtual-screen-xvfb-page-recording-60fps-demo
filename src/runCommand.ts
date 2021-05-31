import {spawn} from 'child_process';

type CommandCallback = {
  onData?: (data: string) => void
  onError?: (error: string) => void
  onComplete?: () => void
}

type ChildProcess = {
  kill: () => void
}

export function runCommandAsync(command: string, args: string[], {
  onData, onError, onComplete
}: CommandCallback = {}): ChildProcess {
  const subprocess = spawn(command, args);

  subprocess.stderr.on('data', (data) => {
    onError?.(data.toString());
  })

  subprocess.stderr.on('error', (error) => {
    onError?.(error.toString());
  })

  subprocess.stdout.on('error', (error) => {
    onError?.(error.toString());
  })

  subprocess.stdout.on('data', (data) => {
    onData?.(data.toString());
  });

  subprocess.on('close', () => {
    onComplete?.();
  })

  return {
    kill: () => {
      subprocess.kill('SIGINT');
    }
  };
}
