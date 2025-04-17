import {
  Alert,
  Avatar,
  Button,
  Card,
  Flex,
  Form,
  Image,
  message,
  Modal,
  Upload,
} from "antd";
import MainAreaLayout from "../components/main-layout/main-layout";
import { useEffect, useState } from "react";
import {
  DeleteOutlined,
  SettingOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { signatureClient } from "../store";
import SignatureClient from "../client/signature";
interface Signature {
  id: string;
  url: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}
const Signatures: React.FC = () => {
  // const { Meta } = Card;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [setting, setSetting] = useState(false);
  const [currentSign, setCurrentSign] = useState<Signature | null>(null);
  const [signatureData, setSignatureData] = useState<Signature[]>([]);
  const [ModalOpen, setModal] = useState(false);
  const [form] = Form.useForm();
  const fetchSignatures = async function () {
    try {
      const res = await signatureClient.getSignatures();
      console.log(res);
      setSignatureData(res);
    } catch (error: any) {
      message.error(error.message);
    }
  };
  const handleImageSubmit = async (info: any) => {
    try {
      console.log(info);
      const res = await signatureClient.UploadSignature(info.Sign.file);
      console.log(res?.data);
      const data = {
        id: res?.data?.id,
        url: res?.data?.url,
        status: res?.data?.status,
        createdAt: res?.data?.creadtedAt,
        updatedAt: res?.data?.updatedAt,
      };
      setModal(false);
      form.resetFields();
      setSignatureData((prev) => [...prev, data]);
      message.success("Signature Succesfuly Uploded");
    } catch (error: any) {
      message.error(error.message);
    }
  };
  const handleDeleteSign = async () => {
    try {
      if (!currentSign) throw new Error("sign is not selected");
      const res = await signatureClient.deleteSignatures(currentSign)
      setSignatureData((prev)=>prev.filter((obj:Signature)=>obj?.id!=currentSign?.id))
      setSetting(false);
      setCurrentSign(null);
      message.success("deleted successfuly");
    } catch (error: any) {
      message.error(error.message);
    }
  };
  useEffect(() => {
    fetchSignatures();
  }, []);
  return (
    <MainAreaLayout
      title="Signature Library"
      extra={
        <Button type="primary" onClick={() => setModal(true)}>
          Add Signature
        </Button>
      }
    >
      {signatureData.length != 0 && (
        <Flex justify="space-around" gap={5} >
          {signatureData.map((obj: Signature) => {
            return (
              <Card
                style={{ width: 200 }}
                cover={<Image src={`${backendUrl}/${obj.url}`} width={200} />}
                actions={[
                  <Button
                    icon={<SettingOutlined key="setting" />}
                    onClick={() => {
                      setCurrentSign(obj);
                      setSetting(true);
                    }}
                  ></Button>,
                ]}
              />
            );
          })}
        </Flex>
      )}
      <Modal
        title="Add New Sign"
        open={ModalOpen}
        footer={null}
        onCancel={() => setModal(false)}
        centered
      >
        <Form form={form} onFinish={handleImageSubmit}>
          <Form.Item
            label="Sign Upload "
            name="Sign"
            rules={[{ required: true }]}
          >
            <Upload
              name="SignFile"
              beforeUpload={() => false}
              accept=".jpeg,.jpg,.bmp,.png"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Upload Signature Image</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
          <Alert
            message="Note"
            description="Your Signature File mime type .jpeg, .jpg, .png, .bmp otherwise file will not be accept"
            type="info"
            showIcon
          />
        </Form>
      </Modal>
      <Modal
        title="Signature Setting"
        open={setting}
        footer={null}
        onCancel={() =>{setCurrentSign(null); setSetting(false)}}
      >
        <Button icon={<DeleteOutlined />} danger onClick={handleDeleteSign}>
          Delete
        </Button>
      </Modal>
    </MainAreaLayout>
  );
};
export default Signatures;
