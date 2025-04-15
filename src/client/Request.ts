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
  async sendExcelData(payload: any) {
    const data = payload.data;
    const templateId = payload.templateId;
    const res = await this.request("PATCH", `/api/templates/${templateId}`, {
      data: data,
    });
    return res.data;
  }
  async getDataExcel(id: string) {
       const res = await this.request(
         "GET",
         `/api/templates/${id}`
       );
       if (res.status != 200) {
         throw new Error("invalid data for backend");
       }
       
       return res.data;
  }
}
