import { Image, ScrollView, Text } from "react-native";
import { LandingStyle } from "../styles/landing";
import { DashboardStyle } from "../styles/dashboard";
import CommonButton from "../components/commonBtn";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { axiosAuth } from "../config/axios";
import { useContext, useEffect, useState } from "react";
import { Context as AuthContext } from '../context/AuthContext';
import { CommonActions } from "@react-navigation/native";

const LandingPage = ({navigation}) => {

  
  const { signin, tryLocalSignin } = useContext(AuthContext);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const getLoggedInUserData = async () => {
    try {
      // Try to restore user data from AsyncStorage first
      await tryLocalSignin();
      
      // Then verify with server
      const response = await axiosAuth.get('/getPatientAllConsultationDates');
      if (response.data && response.data.message === "Data find successfully.") {
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.warn(err.message || "Something went wrong in getLoggedInUserData.");
      setIsLoggedIn(false);
    }
  }

  useEffect(() => {
    getLoggedInUserData();
  }, []);

  const handleRedirect = () => {
    console.warn("handleRedirect");	
    try{
      if(isLoggedIn){
        navigation.dispatch(
                   CommonActions.reset({
                     index: 0,
                     routes: [{ name: 'HealthPlan' }],
                   })
                 );
      }
      else{
        navigation.navigate('UserLogin');
      }
    }
    catch(err){
      console.warn(err.message || "Something went wrong in handleRedirect.");
    }
  }
  return (
    <ScrollView style={LandingStyle.wrapper}>
      <Image source={require('../../assets/images/logo.png')} resizeMode='contain' style={DashboardStyle.logo}/>
        <Text style={LandingStyle.subHeading}> स्वागत है।</Text>
        <Image source={require('../../assets/images/landingImg.png')} resizeMode='contain' style={LandingStyle.featuredImage}/>
        <Text style={LandingStyle.content}>स्वास्थ्य मनुष्य का सबसे बड़ा धन है।</Text>
        <CommonButton title="आगे बढे" onpress={()=>handleRedirect()} />
    </ScrollView>
  );
}
export default LandingPage