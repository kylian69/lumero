import Docker from "dockerode";
import { config } from "./config";

export const docker = new Docker({ socketPath: "/var/run/docker.sock" });

export const containerNameForSlug = (slug: string) => `lume-preview-${slug}`;
export const imageNameForSlug = (slug: string) => `lume-preview-${slug}:latest`;

export async function imageExists(name: string): Promise<boolean> {
  try {
    await docker.getImage(name).inspect();
    return true;
  } catch {
    return false;
  }
}

export async function getContainer(name: string) {
  try {
    const info = await docker.getContainer(name).inspect();
    return info;
  } catch {
    return null;
  }
}

export async function buildImage(opts: {
  contextDir: string;
  imageName: string;
  onLog?: (line: string) => void;
}): Promise<void> {
  const stream = await docker.buildImage(
    { context: opts.contextDir, src: ["."] },
    { t: opts.imageName }
  );

  await new Promise<void>((resolve, reject) => {
    docker.modem.followProgress(
      stream,
      (err, _res) => (err ? reject(err) : resolve()),
      (event: { stream?: string; error?: string }) => {
        if (event.error) opts.onLog?.(`ERROR: ${event.error}`);
        else if (event.stream) opts.onLog?.(event.stream.trim());
      }
    );
  });
}

export async function removeContainerIfExists(name: string): Promise<void> {
  try {
    const c = docker.getContainer(name);
    await c.remove({ force: true });
  } catch (err: unknown) {
    const e = err as { statusCode?: number };
    if (e?.statusCode !== 404) throw err;
  }
}

export async function runContainer(opts: {
  containerName: string;
  imageName: string;
  port: number;
}) {
  await removeContainerIfExists(opts.containerName);

  const container = await docker.createContainer({
    Image: opts.imageName,
    name: opts.containerName,
    Env: [`PORT=${opts.port}`, `HOSTNAME=0.0.0.0`, `NODE_ENV=production`],
    HostConfig: {
      RestartPolicy: { Name: "unless-stopped" },
      NetworkMode: config.PREVIEW_NETWORK,
      // Tighten resources to avoid one preview hogging the host
      Memory: 512 * 1024 * 1024,
      NanoCpus: 1_000_000_000, // 1 CPU max
    },
    Labels: {
      "lume.preview": "true",
      "lume.preview.container": opts.containerName,
    },
  });

  await container.start();
  return container;
}

export async function stopContainerIfRunning(name: string): Promise<void> {
  try {
    const c = docker.getContainer(name);
    const info = await c.inspect();
    if (info.State.Running) {
      await c.stop({ t: 10 });
    }
  } catch (err: unknown) {
    const e = err as { statusCode?: number };
    if (e?.statusCode !== 404) throw err;
  }
}

export async function removeImageIfExists(name: string): Promise<void> {
  try {
    await docker.getImage(name).remove({ force: true });
  } catch (err: unknown) {
    const e = err as { statusCode?: number };
    if (e?.statusCode !== 404) throw err;
  }
}
