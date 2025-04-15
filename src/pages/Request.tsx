import React, { useState } from "react";
import MainAreaLayout from "../components/main-layout/main-layout";
import { Button, Modal, Form, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import readExcelFile from "../service/ReadFile";
import CustomTable from "../components/CustomTable";
import { useParams } from "react-router";
import { requestClient } from "../store";

const RequestPage: React.FC = () => {
  const templateId = useParams()?.id;
  const [ModalDrawer, setModalDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ExcelData, setExcelData] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [, setCurrentPage] = useState<number>(1);

  const uploadFile = async (info: any) => {
    try {
      setLoading(true);
      if (info?.document?.fileList?.length == 0)
        throw new Error("no file uploaded");
      console.log(info.document.file);
      const [data, headers] = await readExcelFile(info.document.file);
      console.table(data);
		await requestClient.sendExcelData({templateId,data});
      const temp = Object.keys(data[0]).map((key) => ({
        title: key,
        dataIndex: key,
        key: key,
      }));
      setColumns(temp);
      setExcelData(data);
    } catch (error: any) {
      console.log(error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainAreaLayout
      title="Request Management"
      extra={
        <>
          <Button type="primary" onClick={() => setModalDrawer(true)}>
            Upload File
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
        <Form onFinish={uploadFile}>
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
