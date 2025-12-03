import { Image, ScrollView, Text, View, Dimensions } from "react-native";
import { LandingStyle } from "../styles/landing";
import { DashboardStyle } from "../styles/dashboard";
import CommonButton from "../components/commonBtn";
import { axiosAuth } from "../config/axios";
import { useContext, useEffect, useState } from "react";
import { Context as AuthContext } from '../context/AuthContext';
import { CommonActions } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const LandingPage = ({ navigation }) => {

  const { tryLocalSignin } = useContext(AuthContext);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const getLoggedInUserData = async () => {
    try {
      await tryLocalSignin();
      const response = await axiosAuth.get('/getPatientAllConsultationDates');

      if (response.data && response.data.message === "Data find successfully.") {
        setIsLoggedIn(true);
      }
    } catch (err) {
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    getLoggedInUserData();
  }, []);

  const handleRedirect = () => {
    try {
      if (isLoggedIn) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'HealthPlan' }],
          })
        );
      } else {
        navigation.navigate('UserLogin');
      }
    } catch (err) {
      console.warn("Redirect error");
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flex: 1, alignItems: "center", paddingTop: 40 }}>

        {/* LOGO FIXED — stays down properly */}
        <Image 
          source={require('../../assets/images/logo.png')} 
          resizeMode='contain' 
          style={[DashboardStyle.logo, { marginBottom: -10 }]}
        />

        <Text style={LandingStyle.subHeading}> स्वागत है।</Text>

        {/* MAIN IMAGE FIXED — no cropping now */}
        <Image 
          source={require('../../assets/images/landingImg.png')} 
          resizeMode='contain'
          style={{
            width: width * 0.9,
            height: width * 0.9,   // keeps full original aspect ratio
            marginVertical: 10,
          }}
        />

        <Text style={LandingStyle.content}>
          स्वास्थ्य मनुष्य का सबसे बड़ा धन है।
        </Text>

        <View style={{ marginTop: 30, width: "80%" }}>
          <CommonButton title="आगे बढे" onpress={handleRedirect} />
        </View>

      </View>
    </ScrollView>
  );
};

export default LandingPage;
