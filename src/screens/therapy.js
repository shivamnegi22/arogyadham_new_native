import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { DashboardStyle } from "../styles/dashboard";
import { Context as AuthContext } from '../context/AuthContext';
import { Context as LanguageContext } from '../context/LanguageContext';
import { useContext, useEffect, useState } from "react";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { axiosAuth } from "../config/axios";
import { getTranslation } from "../utils/translations";

const TherapyPage = ({ navigation }) => {
  const { state } = useContext(AuthContext);
  const { state: langState, loadLanguage } = useContext(LanguageContext);
  const [therapyData, setTherapyData] = useState({});
  const [loading, setLoading] = useState(false);

  const getTherapyData = async () => {
    setLoading(true);
    try {
      const response = await axiosAuth.get('/patient-treatment');
      if (response.data && response.data.data) {
        setTherapyData(response.data.data);
      }
    } catch (error) {
      console.warn(error.message || "Error fetching therapy data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getTherapyData();
    loadLanguage();
  }, []);

  const t = (key) => getTranslation(langState.language, key);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={DashboardStyle.wrapper}>
          <View style={{ paddingHorizontal: 30, paddingTop: 65 }}>
            <Image
              source={require('../../assets/images/logo.png')}
              resizeMode="contain"
              style={DashboardStyle.logo}
            />
            <Text style={DashboardStyle.subHeading}>
              {langState.language === 'hindi' ? 'चिकित्सा योजना' : 'Therapy Plan'}
            </Text>

            {loading ? (
              <View style={{backgroundColor:'white',padding:15,borderRadius:8,marginBottom:15,alignItems:'center'}}>
                <Text style={{fontSize:14,color:'#5F5F5F'}}>
                  {langState.language === 'hindi' ? 'लोड हो रहा है...' : 'Loading...'}
                </Text>
              </View>
            ) : (
              <>
                {Object.keys(therapyData).length > 0 ? (
                  Object.entries(therapyData).map(([therapyType, therapies], index) => (
                    <View key={index} style={{backgroundColor:'white',padding:15,borderRadius:8,marginBottom:15}}>
                      <Text style={{fontSize:16,fontWeight:'bold',color:'#01c43d',marginBottom:12}}>
                        {String(therapyType)}
                      </Text>
                      
                      {therapies.map((therapy, therapyIndex) => (
                        <View key={therapy.id} style={{marginBottom:12,padding:12,backgroundColor:'#f8f9fa',borderRadius:6}}>
                          <Text style={{fontSize:14,fontWeight:'500',color:'#2D2D2D',marginBottom:4}}>
                            {langState.language === 'hindi' ? 
                              (therapy.title_hin || therapy.title_eng) : 
                              (therapy.title_eng || therapy.title_hin)
                            }
                          </Text>
                          
                          {therapy.description && (
                            <Text style={{fontSize:12,color:'#5F5F5F',lineHeight:16}}>
                              {String(therapy.description)}
                            </Text>
                          )}
                          
                          {therapy.file && (
                            <Text style={{fontSize:11,color:'#01c43d',marginTop:4}}>
                              {langState.language === 'hindi' ? 'फाइल उपलब्ध' : 'File available'}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  ))
                ) : (
                  <View style={{backgroundColor:'white',padding:15,borderRadius:8,marginBottom:15,alignItems:'center'}}>
                    <Text style={{fontSize:14,color:'#5F5F5F',textAlign:'center'}}>
                      {langState.language === 'hindi' ? 'कोई चिकित्सा उपलब्ध नहीं है' : 'No therapy available'}
                    </Text>
                  </View>
                )}

                {/* Therapy Tips */}
                <View style={{backgroundColor:'white',padding:15,borderRadius:8,marginBottom:15}}>
                  <Text style={{fontSize:16,fontWeight:'bold',marginBottom:12,color:'#01c43d'}}>
                    {langState.language === 'hindi' ? 'चिकित्सा सुझाव' : 'Therapy Tips'}
                  </Text>
                  <Text style={{fontSize:13,color:'#2D2D2D',marginBottom:6,lineHeight:18}}>
                    {langState.language === 'hindi' ? '• नियमित रूप से चिकित्सा का पालन करें' : '• Follow therapy regularly'}
                  </Text>
                  <Text style={{fontSize:13,color:'#2D2D2D',marginBottom:6,lineHeight:18}}>
                    {langState.language === 'hindi' ? '• डॉक्टर के निर्देशों का पालन करें' : '• Follow doctor\'s instructions'}
                  </Text>
                  <Text style={{fontSize:13,color:'#2D2D2D',marginBottom:6,lineHeight:18}}>
                    {langState.language === 'hindi' ? '• धैर्य रखें और निरंतरता बनाए रखें' : '• Be patient and consistent'}
                  </Text>
                  <Text style={{fontSize:13,color:'#2D2D2D',lineHeight:18}}>
                    {langState.language === 'hindi' ? '• किसी भी समस्या के लिए संपर्क करें' : '• Contact for any issues'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View style={{ flexDirection: 'row', backgroundColor: 'white', elevation: 5 }}>
        <Pressable style={{ flex: 1, alignItems: 'center', padding: 10 }} onPress={()=>navigation.navigate('Profile')}>
          <FontAwesome6 name="user-gear" size={20} color="#10331b" style={{ width: 24 }} />
          <Text style={{fontSize:9,color:'#10331b',marginTop:2}}>
            {langState.language === 'hindi' ? 'प्रोफाइल' : 'Profile'}
          </Text>
        </Pressable>
        <Pressable style={{ flex: 1, alignItems: 'center', padding: 10 }} onPress={()=>navigation.navigate('HealthPlan')}>
          <Ionicons name="fitness" size={20} color="#10331b" style={{ width: 24 }} />
          <Text style={{fontSize:9,color:'#10331b',marginTop:2}}>
            {langState.language === 'hindi' ? 'स्वास्थ्य' : 'Health'}
          </Text>
        </Pressable>
        <Pressable style={{ flex: 1, alignItems: 'center', padding: 10 }} onPress={()=>navigation.navigate('Medicine')}>
          <MaterialCommunityIcons name="pill" size={20} color="#10331b" style={{ width: 24 }} />
          <Text style={{fontSize:9,color:'#10331b',marginTop:2}}>
            {langState.language === 'hindi' ? 'दवाई' : 'Medicine'}
          </Text>
        </Pressable>
        <Pressable style={{ flex: 1, alignItems: 'center', padding: 10 }}>
          <MaterialCommunityIcons name="medical-bag" size={24} color="#01c43d" style={{ width: 28 }} />
          <Text style={{fontSize:9,color:'#01c43d',marginTop:2,fontWeight:'bold'}}>
            {langState.language === 'hindi' ? 'चिकित्सा' : 'Therapy'}
          </Text>
        </Pressable>
        <Pressable style={{ flex: 1, alignItems: 'center', padding: 10 }} onPress={()=>navigation.navigate('Sound')}>
          <MaterialCommunityIcons name="music-note" size={20} color="#10331b" style={{ width: 24 }} />
          <Text style={{fontSize:9,color:'#10331b',marginTop:2}}>
            {langState.language === 'hindi' ? 'ध्वनि' : 'Sound'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default TherapyPage;