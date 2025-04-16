import {
  Button,
  Flex,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Upload,
} from "antd";
import MainAreaLayout from "../components/main-layout/main-layout";
import { useEffect, useState } from "react";
import CustomTable from "../components/CustomTable";
import { AxiosError } from "axios";
import { requestClient, useAppStore } from "../store";
import { UploadOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router";
import { signStatus } from "../libs/constants";
interface officers {
  id: String;
  name: String;
}
interface requests {
  id: string;
  templateName: string;
  description: string;
  createdAt: string;
  status: number;
  url: string;
  signStatus: number;
  createdBy: string;
  DocCount:any
}
const Requests: React.FC = () => {
  const navigate = useNavigate();
  const session = useAppStore().session?.userId;
const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [data, setdata] = useState<requests[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setCurrentPage] = useState<number>(1);
  const [selectedOfficer, setSelectedOfficer] = useState<string>("");
  const [officers, setOfficers] = useState<officers[]>([]);
  const [Request, setRequest] = useState<requests | null>(null);
  const [officerDrawer, setOfficerDrawer] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form] = Form.useForm();
  const [OfficerForm] = Form.useForm();
  const [template, setTemplate] = useState<File | any>(null);
  const fetchData = async () => {
    try {
      setLoading(true);
      const requestsData = await requestClient.getRequests();
      console.log(requestsData);
      setdata(requestsData);
      const officersFromServer = await requestClient.getofficers();
      console.log(officersFromServer);
      const arr: officers[] = officersFromServer.map((element) => ({
        label: element.name,
        value: element.id,
      }));
      setOfficers(arr);
    } catch (error) {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.error);
        return;
      }
      if (error instanceof Error) {
        message.error(error.message);
        return;
      }
      message.error("Failed to fetch courts");
    } finally {
      setLoading(false);
    }
  };
  const handlerequest = () => {
    form.resetFields();
    setIsDrawerOpen(true);
  };
  const handleOfficerChange = (value: string) => {
    console.log(value);
    setSelectedOfficer(value);
  };
  const fileSelect = (info: any) => {
    if (info.fileList.length == 0) {
      alert("select file");
      return;
    }
    console.log(info);
    setTemplate(info.fileList[0]);
  };
  const onSubmitForm = async () => {
    try {
      const values = await form.validateFields();
      const { name, Description, template } = values;
      console.log(name, Description, template, values);
      const payload = {
        name: name,
        description: Description,
        File: template.file,
      };
      const response = await requestClient.sendData(payload);
      setdata((prev) => [...prev, response]);
      setIsDrawerOpen(false);
      form.resetFields();
    } catch (error) {
      message.error("failed to upload");
    }
  };
  const sendSignHandle = async () => {
    try {
      console.log(selectedOfficer);
      try {
        const res = await requestClient.sendToOfficer({
          selectedOfficer,
          Request,
        });
        console.log(res);
        setOfficerDrawer(false);
        OfficerForm.resetFields();
        setdata((prev) =>
          prev.map((obj) => {
            if (obj.id === Request?.id) return { ...obj, signStatus: 1 };
            return obj;
          })
        );
      } catch (err: any) {
        message.error(err.message);
      }
    } catch (error) {
      message.error("network error");
    }
  };
  const deletRequest = async (id: string) => {
    try {
      await requestClient.deleteRequest(id);
      setdata((prev) => prev.filter((obj: any) => obj.id != id));
      message.success("Request is deleted");
    } catch (error: any) {
      message.error(error.message);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const columns = [
    {
      title: "Request Name",
      dataIndex: "templateName",
      key: "templateName",
      render: (text: string, record: requests) => {
        return (
          <Button type="link">
            <Link to={`${backendUrl}/${record.url}`}>{text}</Link>
          </Button>
        );
      },
    },
    {
      title: "Number Of Document",
      dataIndex: "DocCount",
      key: "DocCount",
      render: (text: number, record: requests) => {
        return (
          <Button
            type="link"
            onClick={() => navigate(`/dashboard/request/${record.id}`)}
          >
            {text}
          </Button>
        );
      },
    },
    {
      title: "Number Of Rejected Document",
      dataIndex: "rejectCount",
      key: "rejectCount",
      render: (text: number) => {
        return (
          <Button type="link" onClick={() => alert(text)}>
            {text}
          </Button>
        );
      },
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdat",
    },
    {
      title: "Request Status",
      dataIndex: "signStatus",
      key: "rqststatus",
      render: (text: number) => {
        if (text == 0) {
          return <>Draft</>;
        } else if (text == 1) {
          return <>Waiting For Sign</>;
        } else if (text == 3) {
          return <>Delegated</>;
        } else if (text == 5) {
          return <>Signed</>;
        } else if (text == 6) {
          return <>Ready For Dispatched</>;
        }
      },
    },
    {
      title: "Action",
      dataIndex: "signStatus",
      key: "action",
      render: (action: number, request: requests) => {
        if (request.createdBy === session) {
          if (action == signStatus.unsigned && request.createdBy === session ) {
            return (
              <Flex justify="space-around" gap={5}>
                <Button
                  onClick={() => {
                    if(request.DocCount!=0)
                    setOfficerDrawer(true), setRequest(request);
                  else
                    message.error("no document is uploaded")
                  }}
                >
                  Send
                </Button>
                <Popconfirm
                  title="Delete this court?"
                  onConfirm={() => deletRequest(request.id)}
                >
                  <Button danger>Delete</Button>
                </Popconfirm>
                <Button>Clone</Button>
              </Flex>
            );
          } else if (action == signStatus.readyForSign) {
            return <Button>Clone</Button>;
          }
        }else{
          if(action==signStatus.readyForSign){
            return (
              <Flex justify="space-around" gap={6}>
                <Button>Sign All</Button>
                <Button>Reject</Button>
                <Button>Delegate</Button>
              </Flex>
            );
          }
        }
      },
    },
  ];

  return (
    <MainAreaLayout
      title="Request Management"
      extra={
        <Button type="primary" onClick={handlerequest}>
          Add request
        </Button>
      }
    >
      <CustomTable
        serialNumberConfig={{
          name: "",
          show: true,
        }}
        columns={columns}
        data={data}
        loading={loading}
        onPageChange={(page) => setCurrentPage(page)}
      />
      <Modal
        title={"Make new request"}
        centered
        open={isDrawerOpen}
        footer={null}
        onCancel={() => setIsDrawerOpen(false)}
      >
        <Form form={form} onFinish={onSubmitForm}>
          <Form.Item
            label="Request Name"
            name="name"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter request name" />
          </Form.Item>
          <Form.Item
            label="Request Description"
            name="Description"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={5} placeholder="Enter request name" />
          </Form.Item>
          <Form.Item
            label="Upload .docx Template"
            name="template"
            rules={[{ required: true }]}
          >
            <Upload
              beforeUpload={() => false}
              name="file"
              accept=".docx"
              listType="text"
              onChange={fileSelect}
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

      {/** select officer modal */}
      <Modal
        title={"Select Officer"}
        centered
        open={officerDrawer}
        footer={null}
        onCancel={() => setOfficerDrawer(false)}
      >
        <Form form={OfficerForm} onFinish={sendSignHandle}>
          <Form.Item>
            <Select options={officers} onChange={handleOfficerChange}></Select>
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

export default Requests;
