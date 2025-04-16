import * as XLSX from "xlsx";

const readExcelFile = async (file: File) => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  });

  if (jsonData.length == 0) throw new Error("file is empty");
  if (jsonData.length == 1) throw new Error("file is empty only have headers");
  const jsonDataa = XLSX.utils.sheet_to_json(worksheet, { raw: false });
  const headers: any = jsonData[0];
  jsonDataa.forEach((obj: any) => {
    const keys = Object.keys(obj);
    const missingKeys = headers.filter((header: any) => !keys.includes(header));
    console.log(headers);
    if (missingKeys.length > 0) {
      console.log(obj);
      throw new Error(`Excel Entry is not completed at row ${obj?.__rowNum__}`);
    }
  });
  return jsonDataa;
};
export default readExcelFile;
