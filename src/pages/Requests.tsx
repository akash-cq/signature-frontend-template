import {
  Alert,
  Button,
  Flex,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Tag,
  Upload,
} from "antd";
import MainAreaLayout from "../components/main-layout/main-layout";
import { useEffect, useState } from "react";
import CustomTable from "../components/CustomTable";
import { AxiosError } from "axios";
import { requestClient, useAppStore } from "../store";
import { ClockCircleOutlined, UploadOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router";
import { signStatus } from "../libs/constants";
import Search from "antd/es/transfer/search";
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
  DocCount: any;
}
const Requests: React.FC = () => {
  const navigate = useNavigate();
  const session = useAppStore().session?.userId;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [otpModal, setOtpModal] = useState<boolean>(false);
  const [data, setdata] = useState<requests[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setCurrentPage] = useState<number>(1);
  const [selectedOfficer, setSelectedOfficer] = useState<string>("");
  const [officers, setOfficers] = useState<officers[]>([]);
  const [Request, setRequest] = useState<requests | null>(null);
  const [officerDrawer, setOfficerDrawer] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [OfficerForm] = Form.useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const requestsData = await requestClient.getRequests();
      console.log(requestsData);
      setdata(requestsData);
      const officersFromServer = await requestClient.getofficers();
      const arr: any = officersFromServer.map((element) => ({
        label: element.name,
        value: element.id,
      }));
      setOfficers(arr);
    } catch (error: any) {
      if (error.AxiosError.status != 404) message.error("Failed to fetch data");
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

  const onSubmitForm = async () => {
    try {
      const values = await form.validateFields();
      const { name, Description, template } = values;
      if (name.trim() == "" || Description.trim() == "")
        throw new Error("name and Desription is empty");
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
      message.success("Succesfuly Request is Created");
    } catch (error: any) {
      message.error(error.message ?? "failed to upload");
    }
  };
  const sendSignHandle = async () => {
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
      message.success("Succesfuly Send For Sign");
    } catch (err: any) {
      message.error(err.message);
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
  const handleSearch = (e: any) => {
    console.log(e.target.value);
  };
  const handleSign = async (request: requests) => {
    try {
      const res = await requestClient.SignAll(request);
      setOtpModal(true);
    } catch (error: any) {
      message.error(error.message);
    }
  };
  useEffect(() => {
    console.log(data, "ehvhedcvxv");
    if (data.length == 0) fetchData();
  }, []);
  const columns = [
    {
      title: "Request Name",
      dataIndex: "templateName",
      key: "templateName",
      render: (text: string, record: requests) => {
        return (
          <Button type="link">
            <Link
              to={`${backendUrl}/templates/preview/docx/${record.id}`}
              target="_blank"
            >
              {text}
            </Link>
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
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdat",
    },
    {
      title: "Request Status",
      dataIndex: "signStatus",
      key: "rqststatus",
      render: (text: number, record: requests) => {
        if (record.createdBy === session) {
          if (text == 0) {
            return <Tag>Draft</Tag>;
          } else if (text == 1) {
            return <Tag icon={<ClockCircleOutlined />}>Waiting For Sign</Tag>;
          } else if (text == 3) {
            return <Tag>Delegated</Tag>;
          } else if (text == 5) {
            return <Tag>Signed</Tag>;
          } else if (text == 6) {
            return <Tag>Ready For Dispatched</Tag>;
          }
        } else {
          if (text == 1) {
            return <Tag icon={<ClockCircleOutlined />}>Pending</Tag>;
          } else if (text == 3) {
            return <Tag>Delegated</Tag>;
          } else if (text == 5) {
            return <Tag>Signed</Tag>;
          } else if (text == 6) {
            return <Tag>Ready For Dispatched</Tag>;
          }
        }
      },
    },
    {
      title: "Action",
      dataIndex: "signStatus",
      key: "action",
      render: (action: number, request: requests) => {
        if (request.createdBy === session) {
          if (action == signStatus.unsigned && request.createdBy === session) {
            return (
              <Flex justify="space-around" gap={5} vertical>
                <Button
                  onClick={() => {
                    if (request.DocCount != 0)
                      setOfficerDrawer(true), setRequest(request);
                    else message.error("no document is uploaded");
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
        } else {
          if (action == signStatus.readyForSign) {
            return (
              <Flex justify="space-around" gap={6}>
                <Popconfirm
                  title="Are you sure to sign all?"
                  onConfirm={() => handleSign(request)}
                >
                  <Button>Sign All</Button>
                </Popconfirm>
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
        <Flex justify="space-evenly" gap={10}>
          <Search
            placeholder="Search a request.."
            onChange={handleSearch}
          ></Search>
          <Button type="primary" onClick={handlerequest}>
            Add request
          </Button>
        </Flex>
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
            description="Your template file must have Signature or QR_Code Placeholder otherwise file will be rejected. or placeholder must be in curly braces {}"
            type="info"
            showIcon
          />
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
      <Modal
        title="OTP Verification"
        open={otpModal}
        onCancel={() => setOtpModal(false)}
        footer={null}
      >
        <Form>
          <Form.Item>
            <Input.OTP variant="filled"></Input.OTP>
          </Form.Item>
        </Form>
      </Modal>
    </MainAreaLayout>
  );
};

export default Requests;
