import { Client } from "./abstract";
class SignatureClient extends Client {
  constructor(url: string) {
    super(url);
  }
  async UploadSignature(File: File) {
    if (
      File.type !== "image/jpeg" &&
      File.type !== "image/png" &&
      File.type !== "image/bmp" &&
      File.type !== "image/jpg"
    )
      throw new Error("only .jpeg/.jpg/.png/.bmp image allowed");
    const formData = new FormData();
    formData.append("signature", File);
    const res = await this.request("POST", "/signatures", {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      data: formData,
    });
    return res;
  }
  async getSignatures() {
    const res = await this.request("GET", "/api/signatures");
    return res.data;
  }
  async deleteSignatures(data:any) {
    const res = await this.request("DELETE", `/signatures/${data.id}`);
    return res.data;
  }
  
}
export default SignatureClient;
