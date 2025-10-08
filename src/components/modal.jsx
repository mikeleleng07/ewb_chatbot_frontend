import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Divider,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// Import components
import LivenessDetection from "./liveness/index";
// import LoanComputation from "./LoanComputation";
// import SignaturePad from "./PenInput";

// import UploadAttachment from "./uploader";
// import TermsAndConditionsAcqui from "./termsAndConditions_acqui";
// import TermsAndConditionsPL from "./termsAndConditions_pl";

const CustomModal = ({ onSave = () => {}, toggle = () => {}, activeItem = {} }) => {
  const [componentToShow, setComponentToShow] = useState(null);
  const [headerLabel, setHeaderLabel] = useState(null);

  const livenessDetectionRef = useRef();
  const LoanComputationRef = useRef();
  const PenInputRef = useRef();

  useEffect(() => {
    switch (activeItem.actiontype) {
      case "livenessdetection":
        setComponentToShow("livenessdetection");
        setHeaderLabel("Liveness Detection");
        break;
      case "loancomputation":
        setComponentToShow("loancomputation");
        setHeaderLabel("Loan Calculator");
        break;
      case "peninput":
        setComponentToShow("peninput");
        setHeaderLabel("Signature Input");
        break;
      case "signatureinput":
        setComponentToShow("signatureinput");
        setHeaderLabel("Hello World!!!!");
        break;
      // case "reviewapplication":
      //   setComponentToShow("reviewapplication");
      //   setHeaderLabel("Review Application");
      //   break;
      case "webattachment":
        setComponentToShow("webattachment");
        setHeaderLabel("Attachment Upload");
        break;
      case "termsandconditions_acqui":
        setComponentToShow("termsandconditions_acqui");
        setHeaderLabel("Terms and Conditions");
        break;
      case "termsandconditions_pl":
        setComponentToShow("termsandconditions_pl");
        setHeaderLabel("Terms and Conditions");
        break;
      default:
        setComponentToShow("ERROR");
        setHeaderLabel("Eastwest Bank");
    }
  }, [activeItem]);

  const addressParts = [
    activeItem?.userData?.table?.homeStAddress1,
    activeItem?.userData?.table?.homeCity,
    activeItem?.userData?.table?.homeProvince,
  ];

  const ocrinitialdetails = {
    firstname: activeItem.userData?.table?.firstName,
    homeaddress: addressParts
      .filter((part) => part !== null && part !== undefined && part !== "")
      .join(" "),
  };

  return (
      <Dialog
          open={true}
          onClose={(event, reason) => {
            if (reason === "backdropClick" || reason === "escapeKeyDown") {
              return; // prevent closing
            }
            toggle();
          }}
          disableEscapeKeyDown
          fullWidth
          maxWidth="sm"
          BackdropProps={{
            sx: {
              backgroundColor: "rgba(0, 0, 0, 0.5)", // black transparent background
            },
          }}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: 6,
              backgroundColor: "#fafafa",
              display: "flex",
              flexDirection: "column",
              mt: 5,
            },
          }}
        >
      <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2,
            backgroundColor: "#ffffff",
          }}
        >
    <Box display="flex" alignItems="center">
      <img
        src="/favicon.ico"
        alt="Header Icon"
        style={{ width: 32, height: 32, marginRight: 12 }}
      />
      <Typography variant="h6" fontWeight={700} color="black">
        {headerLabel}
      </Typography>
    </Box>
    <IconButton onClick={toggle} size="small" sx={{ color: "grey.600" }}>
      <CloseIcon />
    </IconButton>
  </DialogTitle>

  <Divider />


      {/* Body */}
        <DialogContent
          sx={{
            p: 3,
            backgroundColor: "#fafafa",
            flex: 1, // still expands
          }}
        >
        {componentToShow === "livenessdetection" && (
          <LivenessDetection
            activeItem={activeItem}
            ref={livenessDetectionRef}
            triggertoggle={toggle}
            onSave={onSave}
          />
        )}
        {/* {componentToShow === "loancomputation" && (
          <LoanComputation
            activeItem={activeItem}
            ref={LoanComputationRef}
            triggertoggle={toggle}
            onSave={onSave}
          />
        )}
        {componentToShow === "peninput" && (
          <SignaturePad
            activeItem={activeItem}
            ref={PenInputRef}
            onSave={onSave}
          />
        )}
        {/* {componentToShow === "reviewapplication" && (
          <AdaptiveCardsCustom
            activeItem={activeItem}
            triggertoggle={toggle}
            onSave={onSave}
          />
        )} */}
        {/* {componentToShow === "webattachment" && (
          <UploadAttachment
            activeItem={activeItem}
            ref={livenessDetectionRef}
            triggertoggle={toggle}
            onSave={onSave}
            InitialData={ocrinitialdetails}
          />
        )}
        {componentToShow === "termsandconditions_acqui" && (
          <TermsAndConditionsAcqui
            activeItem={activeItem}
            onSave={onSave}
            triggertoggle={toggle}
          />
        )}
        {componentToShow === "termsandconditions_pl" && (
          <TermsAndConditionsPL
            activeItem={activeItem}
            onSave={onSave}
            triggertoggle={toggle}
          />
        )} */}
      </DialogContent>
      
    </Dialog>
  );
};

export default CustomModal;
