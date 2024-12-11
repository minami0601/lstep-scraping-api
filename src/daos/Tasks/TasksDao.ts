import { CloudTasksClient } from '@google-cloud/tasks'
export type TaskInfo = {
  host: string
  endpoint: string
  payload: any
}
import { credentials } from '@grpc/grpc-js'
export interface ITasksDao {
  createHttpTask: (taskInfo: TaskInfo) => Promise<void>
}

class TasksDao implements ITasksDao {
  get_info(host: string): {
    client: CloudTasksClient
    parent: string
    baseUrl: string
  } {
    if (process.env.NODE_ENV == 'development') {
      const client = new CloudTasksClient({
        port: 8123,
        servicePath: 'localhost',
        sslCreds: credentials.createInsecure(),
      })
      const project = 'my-project-id'
      const queue = 'my'
      const location = 'us-central1'
      const baseUrl = 'http://local_dev:3000'
      const parent = client.queuePath(project, location, queue)
      return { client: client, parent: parent, baseUrl: baseUrl }
    }
    const client = new CloudTasksClient()
    const project = 'buyma-tool-341513'
    const queue = 'buyma-queue'
    const location = 'asia-northeast1'
    const baseUrl = 'https://' + host

    const parent = client.queuePath(project, location, queue)
    return {
      client: client,
      parent: parent,
      baseUrl: baseUrl,
    }
  }
  public async createHttpTask(taskInfo: TaskInfo): Promise<void> {
    const { client, parent, baseUrl } = this.get_info(taskInfo.host)
    const url = baseUrl + '/' + taskInfo.endpoint

    await client.createTask({
      parent: parent,
      task: {
        httpRequest: {
          httpMethod: 'POST',
          url: url,
          body: Buffer.from(JSON.stringify(taskInfo.payload)).toString(
            'base64'
          ),

          headers: {
            'Content-Type': 'application/json',
          },
        },
        dispatchDeadline: {
          seconds: 60 * 20,
        },
      },
    })
  }
}

export default TasksDao
