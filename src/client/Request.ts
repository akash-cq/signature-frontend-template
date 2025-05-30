import Zod from "zod";
import { officerSchema } from "../responseSchema/users";
import { Client } from "./abstract";
export class RequestClient extends Client {
  constructor(url: string) {
    super(url);
  }
  async getRequests() {
    const res = await this.request("GET", "/api/templates");
    if (res.status != 200) {
      throw new Error("invalid data for backend");
    }

    console.log(res.data);
    return res.data;
  }
  async getofficers() {
    const res = await this.request("GET", "/api/courts/officerForAssignment");
    if (res.status != 200) {
      throw new Error("invalid data for backend");
    }
    const body = Zod.array(officerSchema).safeParse(res?.data);
    if (!body.data) {
      return [];
    }
    const array: Array<typeof officerSchema._type> = [];
    body.data.forEach((ele) => {
      try {
        const parsedData = officerSchema.parse(ele);
        array.push(parsedData);
      } catch (error) {
        console.error(error);
      }
    });
    console.log(array);
    return array;
  }
  async sendData(requestCreation: {
    name: string;
    description: string;
    File: File;
  }) {
    const formData = new FormData();
    formData.append("name", requestCreation.name);
    formData.append("description", requestCreation.description);
    formData.append("template", requestCreation.File);

    const res = await this.request("Post", "/api/templates", {
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    const data = res.data.data;
    data.DocCount = 0;
    data.rejectCount = 0;
    return data;
  }
  async sendExcelData(payload: {
    data:any;
    templateId:string | undefined
  }) {
    const data = payload.data;
    const templateId = payload.templateId;
    const res = await this.request("PATCH", `/api/templates/${templateId}`, {
      data: data,
    });
    return res.data;
  }
  async getDataExcel(id: string | undefined) {
        if (!id) throw new Error("no Template id provided");

    const res = await this.request("GET", `/api/templates/${id}`);
    if (res.status != 200) {
      throw new Error("invalid data for backend");
    }
    console.log(res);
    const headers = res.data?.placeholder;
    const data = res.data?.finaldata;
    const url = res.data?.url;
    const metadata = res.data?.metadata;
    return [data, headers, url, metadata];
  }
  async deleteRequest(id: string | undefined) {
        if (!id) throw new Error("no Template id provided");

    await this.request("DELETE", `/api/templates/${id}`);
    return;
  }
  async sendToOfficer(requests: { selectedOfficer: string; Request: any }) {
    const res = await this.request("POST", "/api/templates/assign", {
      data: requests,
    });
    return res;
  }
  async deleteExcelEntry(data: any, templateId: string | undefined) {
    if(!templateId) throw new Error("no Template id provided")
    await this.request(
      "DELETE",
      `/api/templates/entry/${templateId}/${data.id}/`
    );
    return;
  }
  async rejectDoc(data:any) {
    const res = await this.request("POST", "/api/templates/reject", {
      data: data,
    });
    return res.data;
  }
  async sendForClone(data: Object) {
    const res = await this.request('POST',"/api/templates/clone",{
      data:data
    })
    const dataObj = res.data.data;
    dataObj.DocCount = 0;
    dataObj.rejectCount = 0;
    return dataObj;
  }
  async delegated(data:Object){
    const res = await this.request("POST", "/api/templates/delegated",{
      data
    });
    return res.data;
  }
  async sendDispatch(data:Object){
    const res = await this.request("POST", "/api/disptach", {
      data,
    });
    return res.data;
  }
}
