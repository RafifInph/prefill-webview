import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Stack, Link } from "expo-router";
import { StyleSheet, View } from "react-native";
import WebView from "react-native-webview";
import Storage from "expo-storage";
import { useEffect, useMemo, useState } from "react";

const storageSetItem = async (id: string, item: string) => {
  return await Storage.setItem({ key: id, value: item });
};

const storageGetItem = async (id: string) => {
  return await Storage.getItem({ key: id });
};

const inputSetterScript = `
// Function to set React Native Input Text
function setNativeValue(element, value) {
  if (!element){
    return;
  }
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

  if (valueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else {
    valueSetter.call(element, value);
  }
}

// Send postMessage data to Mobile App
function sendToRN(val) {
  window.ReactNativeWebView.postMessage(val);
}

`;

const httpCallTracker = `
    // Override fetch 
    (function() {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        
        // Send request details to React Native
        sendToRN(JSON.stringify({
          type: 'fetch',
          url: args[0],
          options: args[1],
          status: response.status
        }));

        if (args[0]?.startsWith("https://tw-poc.glitch.me/users") && args[1]?. ){
          window.location.href = "https://pwa-poc-n5my.vercel.app/";
        }
        
        return response;
      };
    })();

  `;

const inputScript = ({
  idNum = "",
  firstName = "",
  lastName = "",
  email = "",
  arrivalDate = "",
}: {
  idNum?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  arrivalDate?: string;
}) => `
  let lastHref = '';
  let setterInterVal;

  function setInputData(){
    // Set ID Number
    const idNumInput = document.getElementsByName('id')[0];
    setNativeValue(idNumInput, '${idNum}');
    idNumInput?.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Set First Name
    const firstNameInput = document.getElementsByName('firstName')[0];
    setNativeValue(firstNameInput, '${firstName}');
    firstNameInput?.dispatchEvent(new Event('input', { bubbles: true }));

    // Set Last Name
    const lastNameInput = document.getElementsByName('lastName')[0];
    setNativeValue(lastNameInput, '${lastName}');
    lastNameInput?.dispatchEvent(new Event('input', { bubbles: true }));

    // Set Email Address
    const emailInput = document.getElementsByName('email')[0];
    setNativeValue(emailInput, '${email}');
    emailInput?.dispatchEvent(new Event('input', { bubbles: true }));

    // Click Arrival Date Radio
    const arrivalDateList = document.getElementsByName('arrivalDate')
      .forEach((el) => {
        if (el?.value === '${arrivalDate}'){
          el?.click();
        }
      });

    
  }

  // Observer Mutation, We can't subscribe to the navigation event because most of the app use react-router
  const observer = new MutationObserver(() => {
    const currentHref = window.location.href;
      if (lastHref != currentHref){
        sendToRN(JSON.stringify({
            type: 'message',
            body: currentHref,
            lastHref,
        }));

        // Page that you want apply the text
        if (currentHref?.startsWith("https://sgac-poc-mgzz.vercel.app/submit-sgac/scpr")){
          setInputData();
        }

      }
      lastHref = window.location.href;
  });
  observer.observe(document.body, { childList: true, subtree: true });

`;

export default function NotFoundScreen() {
  const [formValue, setFormValue] = useState({
    idNum: "",
    firstName: "",
    lastName: "",
    email: "",
    arrivalDate: "",
  });

  useEffect(() => {
    storageGetItem("formData").then((val) => {
      if (val) {
        const parseData = JSON.parse(val);
        setFormValue({
          idNum: parseData?.id ?? "",
          firstName: parseData?.firstName ?? "",
          lastName: parseData?.lastName ?? "",
          email: parseData?.email ?? "",
          arrivalDate: parseData?.arrivalDate ?? "",
        });
      }
    });
  }, []);

  const injectedJavaScript = useMemo(() => {
    return (
      inputSetterScript +
      httpCallTracker +
      inputScript({
        idNum: formValue.idNum,
        firstName: formValue?.firstName,
        lastName: formValue?.lastName,
        email: formValue?.email,
        arrivalDate: formValue?.arrivalDate,
      })
    );
  }, [
    formValue.idNum,
    formValue?.firstName,
    formValue?.lastName,
    formValue?.email,
    formValue?.arrivalDate,
  ]);

  return (
    <View style={{ flex: 1 }}>
      <ThemedText>This is Web View</ThemedText>
      <WebView
        style={styles.container}
        // source={{ uri: "https://sgac-poc-mgzz.vercel.app/submit-sgac/scpr" }}
        source={{ uri: "https://pwa-poc-n5my.vercel.app/" }}
        enableApplePay
        domStorageEnabled
        javaScriptEnabled
        javaScriptCanOpenWindowsAutomatically
        useWebView2
        injectedJavaScript={injectedJavaScript}
        onMessage={(event) => {
          const data = JSON.parse(event.nativeEvent.data);
          if (
            data?.type === "fetch" &&
            (data?.url as string)?.startsWith("https://tw-poc.glitch.me/users")
          ) {
            const method: string = data?.options?.method;
            const body = data?.options?.body
              ? JSON.parse(data?.options?.body)
              : data?.options?.body;
            storageSetItem("formData", data?.options?.body).then(() => {

              storageGetItem("formData").then((val) => {
                if (val) {
                  const parseData = JSON.parse(val);
                  setFormValue({
                    idNum: parseData?.id ?? "",
                    firstName: parseData?.firstName ?? "",
                    lastName: parseData?.lastName ?? "",
                    email: parseData?.email ?? "",
                    arrivalDate: parseData?.arrivalDate ?? "",
                  });
                }
              });
            });
          }
        }}
      />

      <Link href="/home">
        <ThemedText type="link">Go to web-view-page!</ThemedText>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  WebViewContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
