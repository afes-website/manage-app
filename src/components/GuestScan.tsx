import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { CheckCircle } from "@material-ui/icons";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import { WristBand } from "components/MaterialSvgIcons";
import CardList from "components/CardList";
import QRScanner from "components/QRScanner";
import DirectInputModal from "components/DirectInputModal";
import DirectInputFab from "components/DirectInputFab";
import ResultChip, { ResultChipRefs } from "components/ResultChip";
import ErrorDialog from "components/ErrorDialog";
import ExhInfoCard from "components/ExhInfoCard";
import useErrorHandler from "libs/errorHandler";
import { StatusColor } from "types/statusColor";
import clsx from "clsx";
import { Guest } from "@afes-website/docs";

const useStyles = makeStyles((theme) =>
  createStyles({
    list: {
      marginBottom: theme.spacing(2) + 48,
    },
    noPadding: {
      padding: "0 !important",
      objectFit: "cover",
    },
    resultChipBase: {
      position: "relative",
    },
    resultChip: {
      position: "absolute",
      bottom: theme.spacing(2) - 2,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 10,
    },
    progressWrapper: {
      position: "relative",
    },
    progress: {
      position: "absolute",
      top: -6,
      left: -6,
      zIndex: 10,
    },
    successIcon: {
      color: theme.palette.success.main,
    },
  })
);

type Page = `exhibition/${"enter" | "exit"}` | "executive/check-out";

interface Props {
  handleScan: (guestId: string) => Promise<Guest>;
  page: Page;
}

const GuestScan: React.VFC<Props> = (props) => {
  const classes = useStyles();
  const resultChipRef = useRef<ResultChipRefs>(null);

  const [latestGuestId, setLatestGuestId] = useState("");
  const [opensGuestInputModal, setOpensGuestInputModal] = useState(false);
  const [checkStatus, setCheckStatus] = useState<StatusColor | null>(null);

  // エラー処理
  const [errorMessage, errorDialog, , setError] = useErrorHandler();

  const isExh = props.page.split("/")[0] === "exhibition";

  const actionName = ((): string => {
    switch (props.page) {
      case "exhibition/enter":
        return "入室";
      case "exhibition/exit":
        return "退室";
      case "executive/check-out":
        return "退場";
    }
  })();

  const handleGuestIdScan = (guestId: string | null) => {
    if (guestId && guestId !== latestGuestId && checkStatus !== "loading") {
      setCheckStatus("loading");
      setLatestGuestId(guestId);
      props
        .handleScan(guestId)
        .then(() => {
          setCheckStatus("success");
        })
        .catch((e) => {
          setError(e);
        });
    }
  };

  useEffect(() => {
    switch (checkStatus) {
      case "loading":
        if (resultChipRef.current) resultChipRef.current.close();
        break;
      case "success":
        setTimeout(() => {
          setCheckStatus(null);
          setLatestGuestId("");
        }, 3000);
        if (resultChipRef.current)
          resultChipRef.current.open(
            "success",
            `${actionName}成功 / ゲスト ID: ${latestGuestId}`,
            3000
          );
        break;
      case "error":
        if (resultChipRef.current)
          resultChipRef.current.open(
            "error",
            `${actionName}失敗 / ゲスト ID: ${latestGuestId}`
          );
        break;
    }
  }, [checkStatus, latestGuestId, actionName]);

  return (
    <div>
      <Grid container className={classes.list}>
        <Grid item xs={12} md={6}>
          <CardList>
            {/* QR Scanner */}
            <Card>
              <CardContent
                className={clsx(classes.noPadding, classes.resultChipBase)}
              >
                <QRScanner
                  onScanFunc={handleGuestIdScan}
                  videoStop={false}
                  color={checkStatus ?? undefined}
                />
                {/* Result Chip */}
                <ResultChip
                  ref={resultChipRef}
                  className={classes.resultChip}
                />
              </CardContent>
            </Card>

            {/* Error Alert */}
            {errorMessage && (
              <Card>
                <CardContent className={classes.noPadding}>
                  <Alert severity="error">{errorMessage}</Alert>
                </CardContent>
              </Card>
            )}
          </CardList>
        </Grid>

        <Grid item xs={12} md={6}>
          <CardList>
            {/* ID List */}
            <Card>
              <CardContent className={classes.noPadding}>
                <List>
                  <ListItem>
                    <ListItemIcon className={classes.progressWrapper}>
                      {checkStatus === "success" ? (
                        <CheckCircle className={classes.successIcon} />
                      ) : (
                        <WristBand />
                      )}
                      {checkStatus === "loading" && (
                        <CircularProgress
                          className={classes.progress}
                          size={36}
                        />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={latestGuestId ? latestGuestId : "-"}
                      secondary="ゲスト ID (リストバンド ID)"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {isExh && <ExhInfoCard />}
          </CardList>
        </Grid>
      </Grid>

      {/* 直接入力ボタン */}
      <DirectInputFab
        onClick={() => {
          setOpensGuestInputModal(true);
        }}
        disabled={checkStatus === "loading"}
      />

      {/* 直接入力モーダル */}
      <DirectInputModal
        open={opensGuestInputModal}
        setOpen={setOpensGuestInputModal}
        onIdChange={handleGuestIdScan}
        currentId={latestGuestId}
        type="guest"
      />

      {/* エラーダイアログ */}
      <ErrorDialog
        open={errorDialog.open}
        title={errorDialog.title}
        message={errorDialog.message}
        onClose={() => {
          errorDialog.setOpen(false);
        }}
      />
    </div>
  );
};

export default GuestScan;
