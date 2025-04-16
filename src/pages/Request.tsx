import React, { useEffect, useState } from "react";
import MainAreaLayout from "../components/main-layout/main-layout";
import { Button, Modal, Form, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import readExcelFile from "../service/ReadFile";
import CustomTable from "../components/CustomTable";
import { Link, useParams } from "react-router";
import { requestClient, useAppStore } from "../store";
import { signStatus } from "../libs/constants";
interface metaData {
  id: string;
  assignedTo: string;
  createdBy: string;
  status: number;
  signStatus: number;
}
const RequestPage: React.FC = () => {
  const session = useAppStore().session?.userId;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const templateId: string | any = useParams()?.id;
  const [metadata, setMetaData] = useState<metaData | null>(null);
  const [ModalDrawer, setModalDrawer] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [ExcelData, setExcelData] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [url, setUrl] = useState<string>("");
  const [, setCurrentPage] = useState<number>(1);

  const uploadFile = async (info: any) => {
    try {
      setLoading(true);
      if (info?.document?.fileList?.length == 0)
        throw new Error("no file uploaded");
      console.log(info.document.file);
      const data = await readExcelFile(info.document.file);
      console.table(data);
      await requestClient.sendExcelData({ templateId, data });
      const finalCalculateData = data.map((obj: any) => {
        obj.signStatus = signStatus.unsigned;
        return obj;
      });
      console.log(finalCalculateData);
      setExcelData((prev) => [...prev, ...finalCalculateData]);
      setModalDrawer(false);
      form.resetFields();
    } catch (error: any) {
      console.log(error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [data, headers, url, metadata] =
        await requestClient.getDataExcel(templateId);
      console.log(headers, data);
      const temp: any = headers.map((key: Object) => ({
        title: key,
        dataIndex: key,
        key: key,
      }));
      temp.push(
        {
          title: "sign Date",
          dataIndex: "signDate",
          key: "signDate",
        },
        {
          title: "Request Status",
          dataIndex: "signStatus",
          key: "requestStatus",
          render: (status: number) => {
            if (status == 3) return <>Delegated</>;
            else if (status == 0) return <>Unsigned</>;
            else if (status == 5) return <>Signed</>;
          },
        },
        {
          title: "Action",
          dataIndex: "signStatus",
          key: "Action",
          render: (status: number) => {
            if (status == 3) return <Button>Preview</Button>;
            else if (status == 0) return <Button danger>Delete</Button>;
            else if (status == 5) return <Button type="primary">Download</Button>;
          },
        }
      );
      setColumns(temp);
      setUrl(url);
      setMetaData(metadata);
      if (data) setExcelData(data);
    } catch (error: any) {
      message.error(error.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <MainAreaLayout
      title="Request Management"
      extra={
        <>
          {metadata?.createdBy === session && (
            <Button
              type="primary"
              onClick={() => {
                if (metadata?.signStatus === signStatus.unsigned)
                  setModalDrawer(true);
                else
                  message.error(
                    "You are already submited for the signing process"
                  );
              }}
            >
              Upload Excel File
            </Button>
          )}
          <Button type="primary">
            <Link to={`${backendUrl}/${url}`}>Download Template</Link>
          </Button>
        </>
      }
    >
      <CustomTable
        serialNumberConfig={{
          name: "",
          show: false,
        }}
        columns={columns}
        data={ExcelData}
        loading={loading}
        onPageChange={(page) => setCurrentPage(page)}
      ></CustomTable>
      <Modal
        title="Upload the Excel Sheet"
        footer={null}
        centered
        open={ModalDrawer}
        onCancel={() => setModalDrawer(false)}
      >
        <Form onFinish={uploadFile} form={form}>
          <Form.Item
            label="Upload .csv,.xlsx,.xls File"
            name="document"
            rules={[{ required: true }]}
          >
            <Upload
              beforeUpload={() => false}
              name="file"
              accept={".csv,.xlsx,.xls"}
              listType="text"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </MainAreaLayout>
  );
};
export default RequestPage;
