import React, { useEffect, useState } from "react";
import MainAreaLayout from "../components/main-layout/main-layout";
import {
  Button,
  Modal,
  Form,
  Upload,
  message,
  Alert,
  Flex,
  Input,
  Tooltip,
  Tag,
  Typography,
} from "antd";
import {
  ArrowDownOutlined,
  EyeOutlined,
  SyncOutlined,
  UploadOutlined,
} from "@ant-design/icons";
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
  delegated?: string;
}
interface ExcelData {
  data: Record<any, any>;
  id?: string;
  url: string;
}
const RequestPage: React.FC = () => {
  const session = useAppStore().session?.userId;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const templateId: string | undefined = useParams()?.id;
  const [metadata, setMetaData] = useState<metaData | null>(null);
  const [rejectModal, setReject] = useState<boolean>(false);
  const [ModalDrawer, setModalDrawer] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [currentReeject, setCurrentReject] = useState<ExcelData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [ExcelData, setExcelData] = useState<ExcelData[]>([]);
  const [columns, setColumns] = useState<Object[]>([]);
  const [, setCurrentPage] = useState<number>(1);
  const updatingData = (d: any) => {
    const finalCalculateData: ExcelData[] = d.data.map((obj: any) => {
      obj.data.id = obj.id;
      obj.data.signStatus = obj.signStatus;
      if (obj?.rejectionReason) obj.data.rejectionReason = obj.rejectionReason;
      return obj.data;
    });
    console.log(d);
    setExcelData(finalCalculateData);
    return;
  };
  const uploadFile = async (info: any) => {
    try {
      setLoading(true);
      if (info?.document?.fileList?.length == 0)
        throw new Error("no file uploaded");
      console.log(info.document.file);
      const data = await readExcelFile(info.document.file);
      console.table(data);
      const d = await requestClient.sendExcelData({ templateId, data });
      updatingData(d);
      setModalDrawer(false);
      message.success("Succesfuly Uploaded The Excel File");
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
      form.resetFields();
    }
  };
  const handleDelete = async (data: ExcelData) => {
    try {
      await requestClient.deleteExcelEntry(data, templateId);
      setExcelData((prev) =>
        prev.filter((obj: ExcelData) => data?.id != obj?.id)
      );
      message.success("Succesfuly Deleted");
    } catch (error: any) {
      message.error(error.message);
    }
  };
  const fetchData = async () => {
    try {
      const [data, headers, url, metadata] =
        await requestClient.getDataExcel(templateId);
      const temp: Object[] = headers.map((key: Object) => ({
        title: key,
        dataIndex: key,
        key: key,
      }));
      temp.push(
        {
          title: "sign Date",
          dataIndex: "signedDate",
          key: "signDate",
          render: (data: string) => {
            if (!data) return <></>;
            const date = new Date(data);
            const formattedDate = ` ${date.getDate()},${date.toLocaleString("en-US", { month: "short" })} ${date.getFullYear()} ${date.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true })}`;

            return <Typography.Text>{formattedDate}</Typography.Text>;
          },
        },
        {
          title: "Reject Reason",
          dataIndex: "rejectionReason",
          key: "rejectionReason",
          render: (msg: string) => {
            if (msg)
              return (
                <Tooltip title={msg} placement="top">
                  <Tag color="error">Rajected</Tag>
                </Tooltip>
              );
            else return <></>;
          },
        },
        {
          title: "Request Status",
          dataIndex: "signStatus",
          key: "requestStatus",
          render: (status: number) => {
            if (status == signStatus.delegated) return <>Delegated</>;
            else if (status == 0) return <>Unsigned</>;
            else if (status == 5) return <>Signed</>;
            else if (status == signStatus.inProcess)
              return (
                <Tag icon={<SyncOutlined spin />} color="processing">
                  Processing
                </Tag>
              );
          },
        },
        {
          title: "Action",
          dataIndex: "signStatus",
          key: "Action",
          render: (status: number, record: ExcelData) => {
            if (status == 3)
              return (
                <Link
                  to={`${backendUrl}/templates/${templateId}/preview/${record?.id}`}
                  target="_blank"
                >
                  <Button icon={<EyeOutlined />}></Button>
                </Link>
              );
            else if (status == 0)
              return (
                <Flex justify="spce-around" gap={10}>
                  <Link
                    to={`${backendUrl}/templates/${templateId}/preview/${record?.id}`}
                    target="_blank"
                  >
                    <Button icon={<EyeOutlined />}></Button>
                  </Link>
                  {metadata.assignedTo != session && (
                    <Button danger onClick={() => handleDelete(record)}>
                      Delete
                    </Button>
                  )}
                  {metadata.assignedTo === session &&
                    metadata.signStatus == signStatus.readyForSign && (
                      <Button
                        danger
                        onClick={() => {
                          setCurrentReject(record);
                          setReject(true);
                        }}
                      >
                        Reject
                      </Button>
                    )}
                </Flex>
              );
            else if (status == 5)
              return (
                <Flex justify="space-around">
                  <Link to={`${record?.url}?preview=yes`} target="_blank">
                    <Button icon={<EyeOutlined />}></Button>
                  </Link>
                  <Link to={record?.url} target="_blank">
                    <Button icon={<ArrowDownOutlined />}></Button>
                  </Link>
                </Flex>
              );
          },
        }
      );
      console.log(data);
      setColumns(temp);
      setMetaData(metadata);
      console.log(data);
      if (data) setExcelData(data);
    } catch (error: any) {
      message.error(error.message);
    }
  };
  const handleReject = async (info: any) => {
    try {
      const payload = {
        ...info,
        Detail: currentReeject,
        templateId: templateId,
      };
      const res = await requestClient.rejectDoc(payload);
      console.log(res);
      setExcelData(res.finaldata);
      setCurrentReject(null);
      setReject(false);

      form.resetFields();
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
            <Link to={`${backendUrl}/api/templates/download/${metadata?.id}`}>
              Download Excel Template
            </Link>
          </Button>
        </>
      }
    >
      <CustomTable
        serialNumberConfig={{
          name: "Sr",
          show: true,
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
          <Alert
            message="Note"
            description="Excel File must have all needed placeholders related with this request's template otherwise download the excel file for Pre-Built headers don't include {IMAGE Signature()} and {QR_Code}"
            type="warning"
            showIcon
          />
        </Form>
      </Modal>
      <Modal
        title="Reject Document"
        open={rejectModal}
        footer={null}
        onCancel={() => setReject(false)}
      >
        <Form onFinish={handleReject} form={form}>
          <Form.Item
            label="Reason For Rejection"
            name="rejection"
            rules={[{ required: true }]}
          >
            <Input placeholder="type the reason..." />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" danger>
              Reject
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </MainAreaLayout>
  );
};
export default RequestPage;
