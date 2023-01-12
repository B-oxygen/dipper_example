import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./MINTCONNECTWALLET.module.css";
import { v4 } from "uuid";
import axios from "axios";
import useAuth from "../hooks/useAuth";

// toast
import { toast } from "react-toastify";

const MINTCONNECTWALLET2 = () => {
  const { user, setUser } = useAuth();

  const [loadingTitle, setLoadingTitle] = useState("");
  const [isFirst, setIsFirst] = useState(true);
  const { klaytn, ethereum } = window;

  const navigate = useNavigate();

  const navigatetoMyGallery = () => {
    navigate("/my-gallery");
  };

  const onFAQClick = useCallback(() => {
    navigate("/faq");
  }, [navigate]);

  const onGALLERYClick = useCallback(() => {
    navigate("/gallery"); // Please sync "MINT4" to the project
  }, [navigate]);

  const onMINTClick = useCallback(() => {
    navigate("/mintconnect-wallet");
  }, [navigate]);

  const onABOUTClick = useCallback(() => {
    navigate("/about");
  }, [navigate]);

  const onButtonNEXTClick = useCallback(() => {
    navigate("/mint2");
  }, [navigate]);

  const onIconTwitterClick = useCallback(() => {
    window.open("https://twitter.com/home?lang=ko");
  }, []);

  const onIconDiscordClick = useCallback(() => {
    window.open("https://discord.com/");
  }, []);

  const onIconLogoClick = useCallback(() => {
    navigate("/");
  }, [navigate]);

  /**
   * 프로필 사진 변경 감지 (myItem.jsx)
   */
  useEffect(() => {
    if (user.imageUrl) {
      if (isFirst) {
        setIsFirst(false);
      } else {
        toast.success("프로필사진이 변경되었습니다.", {
          position: toast.POSITION.BOTTOM_CENTER,
        });
      }
      // setIsOpenProfileModal(true);
    }
  }, [user.imageUrl]);

  /**
   * 0. 메타마스크 로그인 버튼
   * @returns
   */
  async function loginWithMetamask() {
    var isConnected = await connectWithMetamask();
    //connect완료 될 경우 sign진행
    if (isConnected) {
      await signWithMetamask();
    } else {
      return false;
    }
  }

  /**
   * 1. 메타마스크 <-> 웹사이트 connect 확인
   * @returns bool
   */
  async function connectWithMetamask() {
    if (typeof window.ethereum !== "undefined") {
    } else {
      toast.error("Metamask 설치 해주세요!", {
        position: toast.POSITION.TOP_CENTER,
      });
      return false;
    }

    setLoadingTitle("연결중...");

    try {
      await ethereum.request({
        method: "eth_requestAccounts",
      });

      return true;
    } catch (e) {
      toast.error("로그인 실패..! 다시 시도해주세요~^^", {
        position: toast.POSITION.BOTTOM_CENTER,
      });
      return false;
    }
  }

  /**
   * 2. 메타마스크 서명
   */
  async function signWithMetamask() {
    setLoadingTitle("NFT 확인중...");

    //0x1c3C01DC7E9a2A62D25c7Bb705C8F7c27FdF7540
    const contractAddress = "0xC08147CA45b817fe4B8078a7B380d31f76323D17";
    // const contractAddress = "0x8fd2387871ACA7fA628643296Fd4f5Aae4c5c313"; // 테스트용 NFT 1001
    // const contractAddress = "0xd643bb39f81ff9079436f726d2ed27abc547cb38"; // 푸빌라 8217

    const chainId = "5"; //klaytn testnet
    const message =
      "[ NFT HOLDER VERIFY ]  \n contract address : " +
      contractAddress +
      "\n\n Powered by fast-dive";

    // 지갑 네트워크와 조회하려는 NFT의 네트워크가 같은지 체크
    if (String(window.ethereum.networkVersion) !== chainId) {
      toast.warn(
        `네트워크를 goerli 테스트넷 ( 5 ) 으로 변경해주세요. 현재 network : ${window.ethereum.networkVersion}`,
        { position: toast.POSITION.BOTTOM_CENTER }
      );

      return;
    }

    let signObj;

    try {
      signObj = await toast.promise(
        window.ethereum.request({
          method: "personal_sign",
          params: [message, window.ethereum.selectedAddress, v4()],
        }),
        {
          pending: "보유한 NFT 확인중...",
        },
        { closeButton: true }
      );

      // 홀더인증 API (fastdive)

      // fastdive API =======================================================
      const apiKey = "88a23596-fa71-47a1-9294-03b97b0ce696";
      const result2 = await verifyHolder2(
        apiKey, // API키
        signObj, // 서명값
        message, // 서명메세지
        contractAddress, // NFT 컨트랙트주소
        chainId, //체인아이디
        "metamask", //지갑종류
        false // 보유개수만 조회할지 여부 (true일경우 개수만)
      );

      //조회결과
      const data = result2.data.data;
      console.log("조회결과 확인: " + data);
      console.log("개수조회: " + data.balance);
      // =====================================================================

      //조회 후처리
      setDataAfterVerifyHolder(
        result2,
        window.ethereum.selectedAddress,
        "metamask"
      );
    } catch (e) {
      toast.error("로그인 실패..! 다시 시도해주세요~^^", {
        position: toast.POSITION.BOTTOM_CENTER,
      });
      return;
    }
  }
  /**
   * verifyHolder 2
   * @param {*} apiKey
   * @param {*} signObj
   * @param {*} message
   * @param {*} contractAddress
   * @param {*} chainId
   * @param {*} walletType
   * @param {*} onlyBalance
   * @returns
   */
  async function verifyHolder2(
    apiKey,
    signObj,
    message,
    contractAddress,
    chainId,
    walletType,
    onlyBalance
  ) {
    const header = {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    };

    const url = "https://api.fast-dive.com/api/v1/nft/verifyHolder";

    const params = {
      sign: signObj,
      signMessage: message,
      contractAddress: contractAddress,
      chainId: chainId,
      walletType: walletType,
      onlyBalance: onlyBalance,
    };

    return await axios.post(url, params, header);
  }
  /**
   * nft verify Holder 후처리
   * @param {*} result
   * @param {*} ownerAddress
   * @param {*} walletType
   * @returns
   */
  function setDataAfterVerifyHolder(result, ownerAddress, walletType) {
    const data = result.data.data;
    //로그인 요청지갑과 복호화 한 지갑 확인
    if (ownerAddress.toUpperCase() !== data.ownerAddress.toUpperCase()) {
      debugger;
      toast.error("지갑주소가 일치하지 않습니다.", {
        position: toast.POSITION.BOTTOM_CENTER,
      });
      return;
    }
    // 조건만족시 로그인 처리
    if (data.balance > 0) {
      toast.success(`로그인 완료 (balance : ${data.balance})`, {
        position: toast.POSITION.BOTTOM_CENTER,
      });

      setUser({ account: ownerAddress, wallet: walletType });

      // 메타데이터 조회시 첫번째 NFT 이미지Url 저장
      if (data.onlyBalance === false && data.result[0].metadata.image) {
        setUser({
          account: ownerAddress,
          wallet: walletType,
          imageUrl: data.result[0].metadata.image,
          result: data.result,
        });
        navigatetoMyGallery();
      }
    } else {
      toast.error(
        "해당지갑에 NFT를 보유하고 있지 않습니다. 지갑주소를 확인해주세요.",
        {
          position: toast.POSITION.BOTTOM_CENTER,
        }
      );
    }
  }

  return (
    <div className={styles.mintConnectWallet} id="Wrapper">
      <img
        className={styles.universeMintIcon}
        alt=""
        src="../universe-mint@1x.png"
      />
      <button className={styles.coinbasewallet} autoFocus>
        <div className={styles.coinbasewalletChild} id="COINBASEWALLET" />
        <div className={styles.coinbaseWallet}>COINBASE WALLET</div>
        <img
          className={styles.coinbase1Icon}
          alt=""
          src="../coinbase_logo@1x.png"
        />
      </button>
      <button className={styles.kaikas} autoFocus>
        <div className={styles.coinbasewalletChild} id="KAIKAS" />
        <div className={styles.kaiKas}>KAI KAS</div>
        <img
          className={styles.walletconnectLogoIcon}
          alt=""
          src="../Kaikas-logo@1x.png"
        />
      </button>

      <button
        className={styles.metamask}
        autoFocus
        onClick={() => {
          loginWithMetamask();
        }}
      >
        <div className={styles.coinbasewalletChild} id="METAMASK" />
        <div className={styles.metaMask}> META MASK2</div>
        <img
          className={styles.metamask1Icon}
          alt=""
          src="../metamask_logo@1x.png"
        />
      </button>

      <div className={styles.connectWallet} id="Connect_Wallet">
        <div className={styles.connectWalletChild} />
        <div className={styles.connectWallet1}>CONNECT WALLET</div>
      </div>

      <button
        className={styles.buttonNext}
        autoFocus
        onClick={onButtonNEXTClick}
      >
        <img
          className={styles.nametagwt1Icon}
          alt=""
          src="../nametagwt-11@1x.png"
        />
        <div className={styles.next}>NEXT</div>
      </button>

      <div className={styles.navbar} id="navBar">
        <button className={styles.faq} autoFocus onClick={onFAQClick}>
          FAQ
        </button>
        <button className={styles.roadmap}>ROADMAP</button>
        <button className={styles.gallery} autoFocus onClick={onGALLERYClick}>
          GALLERY
        </button>
        <button className={styles.mint} autoFocus onClick={onMINTClick}>
          MINT
        </button>
        <button className={styles.about} autoFocus onClick={onABOUTClick}>
          ABOUT
        </button>
        <a className={styles.iconTwitter} onClick={onIconTwitterClick} />
        <a className={styles.iconDiscord} onClick={onIconDiscordClick} />
        <button
          className={styles.iconLogo}
          autoFocus
          onClick={onIconLogoClick}
        />
      </div>
    </div>
  );
};

export default MINTCONNECTWALLET2;
