import { basename } from 'path'
import { execSync } from 'child_process';
import { existsSync } from 'fs'

import WorkspaceClient, { IRemoteAPI, IRestAPIConfig } from '@eclipse-che/workspace-client';
import { che } from '@eclipse-che/api';

// Eclipse Che Workspace Rest API client 作成
const restApiClient = createRestClient();

// ワークスペース情報取得要求
const CHE_WORKSPACE_ID: string = process.env.CHE_WORKSPACE_ID ?? "";
if (CHE_WORKSPACE_ID === "") {
    console.log("process.env.CHE_WORKSPACE_ID is not found.");
    process.exit(1);
}
const promise: Promise<che.workspace.Workspace> = restApiClient.getById<che.workspace.Workspace>(CHE_WORKSPACE_ID);

promise.then((workspace:che.workspace.Workspace) => {
    // ワークスペース情報取得要求に成功したら、project をクローンする。
    listAllEndpoint(workspace);
}).catch( (e) => {
    // ワークスペース情報取得要求に失敗したら、エラー終了。
    console.log(e);
    process.exit(1);
});

/**
 * Eclipse Che Workspace Rest API client 作成
 */
function createRestClient(): IRemoteAPI {
    // ワークスペース情報取得のための REST クライアント
    const restAPIConfig: IRestAPIConfig = {};
    restAPIConfig.baseUrl = process.env.CHE_API;

    const CHE_MACHINE_TOKEN = process.env.CHE_MACHINE_TOKEN;
    if (CHE_MACHINE_TOKEN) {
        restAPIConfig.headers = {};
        restAPIConfig.headers['Authorization'] = 'Bearer ' + CHE_MACHINE_TOKEN;
    }

    return WorkspaceClient.getRestApi(restAPIConfig);
}

/**
 * devfile で指定された endpoint をリストする
 */
function listAllEndpoint(workspace:che.workspace.Workspace): void {
    const CHE_PROJECTS_ROOT = process.env.CHE_PROJECTS_ROOT;
    const runtime = workspace.runtime;
    assert(runtime, "runtime not found");
    const machines = runtime.machines;
    assert(machines, "machines not found");

    const tmp = Object.keys(machines)
                    .map((macheneName) => machines[macheneName].servers)
                    .filter((e) => e)
                    .map((server) => {
                        assert(server, "server not found");
                        return Object.keys(server)
                                   .map((name) => {
                                        const url = server[name].url;
                                        assert(url);
                                        return new ServerInfo(name, url);
    })});

    assert(tmp, "machines structure broken.");
    const servers = tmp.flat();

    servers.forEach((e : ServerInfo) => {
        console.log(e.name + ': ' + e.url);
    });
}

/**
 * null/undefined を殺すための関数。
 */
function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new AssertionError(msg);
  }
}

/**
 * assert 関数の condition が null/undefined だった場合に送出されるエラー。
 */
class AssertionError extends Error {
}

/**
 * 表示用の情報を格納するためのクラス。
 */
class ServerInfo  {
    name: string;
    url: string;
    
    constructor(name: string, url: string) {
        this.name = name;
        this.url = url;
    }
}
