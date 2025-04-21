import {
  Alert,
  Button,
  Flex,
  Form,
  Image,
  Input,
  message,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import MainAreaLayout from "../components/main-layout/main-layout";
import { useEffect, useState } from "react";
import CustomTable from "../components/CustomTable";
import { requestClient, signatureClient, useAppStore } from "../store";
import {
  ArrowDownOutlined,
  CaretDownFilled,
  CaretUpFilled,
  ClockCircleOutlined,
  PrinterOutlined,
    SyncOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router";
import { signStatus } from "../libs/constants";
import Search from "antd/es/transfer/search";
import socket from "../client/socket";

interface officers {
  value: String;
  label: String;
}
interface Images {
  id: string;
  url: string;
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
  DocCount: number;
  delegationReason?: string;
  rejectCount: number;
  delegatedTo: string;
  totalgenerated?: number;
}
const Requests: React.FC = () => {
  const navigate = useNavigate();
  const session = useAppStore().session?.userId;

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [otpModal, setOtpModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [signModal, setSignModal] = useState<boolean>(false);
  const [delegatedModal, setDelegatedModal] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [officerDrawer, setOfficerDrawer] = useState<boolean>(false);

  const [data, setdata] = useState<requests[]>([]);
  const [officers, setOfficers] = useState<officers[]>([]);
  const [signature, setSignatureData] = useState<Images[]>([]);

  const [CurrentImage, setCurrentImage] = useState<Images | null>(null);
  const [Request, setRequest] = useState<requests | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState<string>("");
  const [, setCurrentPage] = useState<number>(1);
  const [form] = Form.useForm();
  const [OfficerForm] = Form.useForm();
  const setDataIn = (data: requests) => {
    setdata((prev) =>
      prev.map((obj: requests) => {
        if (obj.id === data.id) return data;
        return obj;
      })
    );
  };
  useEffect(() => {
    socket.on("generatedOneBatch", setDataIn);
    socket.on("generatedEnd", setDataIn);
    return () => {
      socket.off("generatedOneBatch", setDataIn);
      socket.off("generatedEnd", setDataIn);
    };
  }, [socket]);
  const fetchData = async () => {
    try {
      setLoading(true);
      const requestsData = await requestClient.getRequests();
      console.log(requestsData);
      setdata(requestsData);
      const officersFromServer = await requestClient.getofficers();
      const arr: officers[] = officersFromServer.map(
        (element) => ({
          label: element.name,
          value: element.id,
        })
      );
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
      setdata((prev) => prev.filter((obj: requests) => obj.id != id));
      message.success("Request is deleted");
    } catch (error: any) {
      message.error(error.message);
    }
  };
  const handleSearch = (e: any) => {
    console.log(e.target.value);
  };
  const handleClone = async (data: requests) => {
    try {
      const res = await requestClient.sendForClone(data);
      setdata((prev) => [...prev, res]);
      message.success("Succesfuly Request is Cloned");
    } catch (error: any) {
      message.error(error.message);
    }
  };
  const handleOtpVerify = async (info: any) => {
    try {
      const res = await signatureClient.verifyOtp(info);
      console.log(info);
      form.resetFields();
      setOtpModal(false);
      getSign();
    } catch (error: any) {
      message.error(error.message);
    }
  };
  const handleDelegated = async (info: any) => {
    try {
      const res = await requestClient.delegated({ ...info, ...Request });
      setDelegatedModal(false);
      form.resetFields();
      setdata((prev) =>
        prev.map((obj) => {
          if (obj.id == Request?.id) {
            return res;
          }
          return obj;
        })
      );
      setRequest(null);
      message.success("sucessfuly delegated");
    } catch (error: any) {
      message.error(error.message);
    }
  };
  const getSign = async () => {
    const res = await signatureClient.getSignatures();
    setSignatureData(res);
    setSignModal(true);
  };
  const getOtp = async (data: requests) => {
    setRequest(data);
    const res = await signatureClient.getOtp(data);
    setOtpModal(true);
  };
  const handleSendSign = (e: any) => {
    console.log("Select", e.target.value);
    setCurrentImage(e.target.value);
  };

  const selectAndSign = async () => {
    try {
      setSignModal(false);
      const payload = {
        templateId: Request?.id,
        SignatureId: CurrentImage?.id,
      };
      const res = await signatureClient.StartSigning(payload);
      message.success("start signing process");
    } catch (error: any) {
      message.error(error.message);
    }
  };
  const sortNewest = () =>{
    let sortedData = [...data];
    sortedData.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    setdata(sortedData)
  }
  const sortOldest = ()=>{
    let sortedData = [...data];
    sortedData.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    setdata(sortedData)
  }
  useEffect(() => {
    console.log(data, "ehvhedcvxv");
    if (data.length == 0) fetchData();
  }, []);

  {
    /** Columns Defination */
  }
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
      title: "Description",
      dataIndex: "description",
      key: "description",
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
      title: (
        <Flex justify="space-around" >
          <span>CreatedAt</span>
          <Flex justify="space-around" vertical>
            <CaretUpFilled onClick={sortNewest}/>
            <CaretDownFilled onClick={sortOldest}/>
          </Flex>
        </Flex>
      ),
      dataIndex: "createdAt",
      key: "createdat",
      render: (data: string) => {
        const date = new Date(data);
        const formattedDate = ` ${date.getDate()},${date.toLocaleString("en-US", { month: "short" })} ${date.getFullYear()} ${date.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true })}`;

        return <Typography.Text>{formattedDate}</Typography.Text>;
      },
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
            return (
              <Tag color="orange" icon={<ClockCircleOutlined />}>
                Waiting For Sign
              </Tag>
            );
          } else if (text == 3) {
            return (
              <Tooltip title={record.delegationReason} placement="top">
                <Tag color="cyan">Delegated</Tag>
              </Tooltip>
            );
          } else if (text == 5) {
            return <Tag color="success">Signed</Tag>;
          } else if (text == 6) {
            return <Tag>Ready For Dispatched</Tag>;
          } else if (text == signStatus.rejected)
            return <Tag color="error">Reject</Tag>;
          else if (text == signStatus.inProcess)
            return (
              <Tag icon={<SyncOutlined spin />} color="processing">
                {record.totalgenerated
                  ? `${record.totalgenerated} Processed`
                  : "0 Processed"}
              </Tag>
            );
        } else {
          if (text == 1) {
            return (
              <Tag color="magenta" icon={<ClockCircleOutlined />}>
                Pending
              </Tag>
            );
          } else if (text == 3 || record.delegatedTo) {
            return (
              <Tooltip title={record.delegationReason} placement="top">
                <Tag color="cyan">Delegated</Tag>
              </Tooltip>
            );
          } else if (text == 5 && !record.delegatedTo) {
            return <Tag color="success">Signed</Tag>;
          } else if (text == 6) {
            return <Tag>Ready For Dispatched</Tag>;
          } else if (text == signStatus.rejected)
            return <Tag color="error">Reject</Tag>;
          else if (text == signStatus.inProcess && !record.delegatedTo)
            return (
              <Tag icon={<SyncOutlined spin />} color="processing">
                {record.totalgenerated
                  ? `${record.totalgenerated} Processed`
                  : "0 Processed"}
              </Tag>
            );
        }
      },
    },
    {
      title: "Action",
      dataIndex: "signStatus",
      key: "action",
      render: (action: number, request: requests) => {
        if (request.createdBy === session || request?.delegatedTo === session) {
          if (action == signStatus.unsigned) {
            return (
              <Flex justify="space-around" gap={5}>
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
                <Button onClick={() => handleClone(request)}>Clone</Button>
              </Flex>
            );
          } else if (action == signStatus.readyForSign) {
            return <Button onClick={() => handleClone(request)}>Clone</Button>;
          } else if (action === signStatus.delegated) {
            return (
              <Popconfirm
                title="Are you sure to sign all?"
                onConfirm={() => getOtp(request)}
              >
                <Button>Sign All</Button>
              </Popconfirm>
            );
          } else if (action == signStatus.Signed) {
            return (
              <Flex justify="space-around" gap={10}>
                <Link
                  to={`${backendUrl}/template/downloads/${request?.id}`}
                  target="_blank"
                >
                  <Button icon={<PrinterOutlined />}>Print All</Button>
                </Link>
                <Link
                  to={`${backendUrl}/template/downloads/${request?.id}`}
                  target="_blank"
                >
                  <Button icon={<ArrowDownOutlined />}>Download All</Button>
                </Link>
              </Flex>
            );
          } else {
            <Button onClick={() => handleClone(request)}>Clone</Button>;
          }
        } else {
          if (action == signStatus.readyForSign) {
            return (
              <Flex justify="space-around" gap={6} vertical>
                <Popconfirm
                  title="Are you sure to sign all?"
                  onConfirm={() => getOtp(request)}
                >
                  <Button>Sign All</Button>
                </Popconfirm>
                <Button>Reject</Button>
                <Button
                  onClick={() => {
                    setRequest(request);
                    setDelegatedModal(true);
                  }}
                >
                  Delegate
                </Button>
              </Flex>
            );
          } else if (action == signStatus.Signed && !request.delegatedTo) {
            return (
              <Link
                to={`${backendUrl}/template/downloads/${request?.id}`}
                target="_blank"
              >
                {" "}
                <Button icon={<ArrowDownOutlined />}>Download All</Button>
              </Link>
            );
          } else {
            <Button onClick={() => handleClone(request)}>Clone</Button>;
          }
        }
      },
    },
  ];

  return (
    /** main area layout */
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
      {/** table layout */}
      <CustomTable
        serialNumberConfig={{
          name: "Sr",
          show: true,
        }}
        columns={columns}
        data={data}
        loading={loading}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/** new Request Modal */}

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
            description="Your template file must have {IMAGE Signature()} and QR_Code Placeholder otherwise file will be rejected. or placeholder must be in curly braces {} without any spaces except Signature"
            type="warning"
            showIcon
          />
        </Form>
      </Modal>

      {/** select officer Modal */}

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

      {/** otp modal */}

      <Modal
        title="OTP Verification"
        open={otpModal}
        onCancel={() => setOtpModal(false)}
        footer={null}
      >
        <Form onFinish={handleOtpVerify} form={form}>
          <Form.Item label="Enter OTP" name="otp" rules={[{ required: true }]}>
            <Input.OTP length={4}></Input.OTP>
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" type="primary">
              Verify
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/** Delegat Modal  */}
      <Modal
        title="Delegate Document"
        open={delegatedModal}
        footer={null}
        onCancel={() => setDelegatedModal(false)}
      >
        <Form form={form} onFinish={handleDelegated}>
          <Form.Item
            label="Reason For Delegation"
            name="delegationReason"
            rules={[{ required: true }]}
          >
            <Input placeholder="type the reason..." />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" type="primary">
              Delegate
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/** Signature Modal */}
      <Modal
        title="Select Signature"
        open={signModal}
        footer={null}
        onCancel={() => setSignModal(false)}
      >
        <Form onFinish={selectAndSign}>
          {CurrentImage && (
            <div style={{ border: "1px solid grey", display: "inline-block" }}>
              <Image src={`${backendUrl}/${CurrentImage?.url}`} width={100} />
            </div>
          )}
          <Form.Item>
            <Radio.Group
              value={CurrentImage}
              onChange={handleSendSign}
              options={signature.map((obj: Images) => ({
                value: obj,
                label: (
                  <div style={{ textAlign: "center" }}>
                    <Image
                      src={`${backendUrl}/${obj.url}`}
                      preview={false}
                      width={100}
                    />
                  </div>
                ),
              }))}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Sign
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </MainAreaLayout>
  );
};

export default Requests;
