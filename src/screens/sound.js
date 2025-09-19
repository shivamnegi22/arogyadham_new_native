import { Image, Pressable, ScrollView, Text, View, Alert } from "react-native";
import { DashboardStyle } from "../styles/dashboard";
import { Context as AuthContext } from '../context/AuthContext';
import { Context as LanguageContext } from '../context/LanguageContext';
import { useContext, useEffect, useState } from "react";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { axiosAuth } from "../config/axios";
import { Audio } from 'expo-av';
import { getTranslation } from "../utils/translations";

const SoundPage = ({ navigation }) => {
  const { state } = useContext(AuthContext);
  const { state: langState } = useContext(LanguageContext);
  const [sounds, setSounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSound, setCurrentSound] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [playbackStatus, setPlaybackStatus] = useState({});
  const [isLoading, setIsLoading] = useState({});

  const t = (key) => getTranslation(langState.language, key);

  const getSounds = async () => {
    setLoading(true);
    try {
      const response = await axiosAuth.get('/get-patient-sound');
      if (response.data && response.data.sounds) {
        setSounds(response.data.sounds);
      }
    } catch (error) {
      console.warn(error.message || "Error fetching sounds");
      Alert.alert('Error', 'Failed to load sounds');
    } finally {
      setLoading(false);
    }
  };

  const playSound = async (sound) => {
    try {
      setIsLoading(prev => ({ ...prev, [sound.id]: true }));

      // Stop current sound if playing
      if (currentSound) {
        await currentSound.unloadAsync();
        setCurrentSound(null);
        setPlayingId(null);
      }

      // Use the full URL from the API response
      const soundUrl = sound.file;
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: soundUrl },
        { 
          shouldPlay: true,
          progressUpdateIntervalMillis: 1000,
          positionMillis: 0
        }
      );

      setCurrentSound(newSound);
      setPlayingId(sound.id);

      newSound.setOnPlaybackStatusUpdate((status) => {
        setPlaybackStatus(prev => ({
          ...prev,
          [sound.id]: status
        }));
        
        if (status.didJustFinish) {
          setPlayingId(null);
          setCurrentSound(null);
        }
      });

    } catch (error) {
      console.warn('Error playing sound:', error);
      Alert.alert('Error', 'Failed to play sound. Please check your internet connection.');
    } finally {
      setIsLoading(prev => ({ ...prev, [sound.id]: false }));
    }
  };

  const pauseSound = async () => {
    if (currentSound) {
      try {
        await currentSound.pauseAsync();
      } catch (error) {
        console.warn('Error pausing sound:', error);
      }
    }
  };

  const resumeSound = async () => {
    if (currentSound) {
      try {
        await currentSound.playAsync();
      } catch (error) {
        console.warn('Error resuming sound:', error);
      }
    }
  };

  const stopSound = async () => {
    if (currentSound) {
      try {
        await currentSound.unloadAsync();
        setCurrentSound(null);
        setPlayingId(null);
      } catch (error) {
        console.warn('Error stopping sound:', error);
      }
    }
  };

  const seekSound = async (position) => {
    if (currentSound) {
      try {
        await currentSound.setPositionAsync(position);
      } catch (error) {
        console.warn('Error seeking sound:', error);
      }
    }
  };

  useEffect(() => {
    getSounds();
    
    // Setup audio mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    return () => {
      if (currentSound) {
        currentSound.unloadAsync();
      }
    };
  }, []);

  const formatTime = (millis) => {
    if (!millis || isNaN(millis)) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (status) => {
    if (!status || !status.durationMillis || !status.positionMillis) return 0;
    return (status.positionMillis / status.durationMillis) * 100;
  };

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
              {langState.language === 'hindi' ? 'ध्वनि चिकित्सा' : 'Sound Therapy'}
            </Text>

            {loading ? (
              <View style={{backgroundColor:'white',padding:20,borderRadius:10,marginBottom:20,alignItems:'center'}}>
                <Text style={{fontSize:16,color:'#5F5F5F'}}>
                  {langState.language === 'hindi' ? 'लोड हो रहा है...' : 'Loading...'}
                </Text>
              </View>
            ) : (
              <>
                {sounds.length > 0 ? (
                  sounds.map((sound, index) => {
                    const isPlaying = playingId === sound.id;
                    const status = playbackStatus[sound.id];
                    const isLoaded = status?.isLoaded;
                    const isPaused = isLoaded && !status?.isPlaying;
                    const isLoadingSound = isLoading[sound.id];
                    
                    return (
                      <View key={sound.id} style={{backgroundColor:'white',padding:20,borderRadius:10,marginBottom:20}}>
                        <Text style={{fontSize:18,fontWeight:'bold',color:'#01c43d',marginBottom:10}}>
                          {langState.language === 'hindi' ? (sound.hi_name || sound.name) : sound.name}
                        </Text>
                        
                        {((sound.description || sound.hi_description)) && (
                          <Text style={{fontSize:14,color:'#5F5F5F',marginBottom:15,lineHeight:20}}>
                            {langState.language === 'hindi' ? (sound.hi_description || sound.description) : sound.description}
                          </Text>
                        )}

                        {/* Audio Controls */}
                        <View style={{marginBottom:15}}>
                          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                            <View style={{flexDirection:'row',alignItems:'center'}}>
                              {!isPlaying ? (
                                <Pressable 
                                  style={{
                                    backgroundColor: isLoadingSound ? '#ccc' : '#01c43d',
                                    padding:12,
                                    borderRadius:25,
                                    marginRight:10,
                                    opacity: isLoadingSound ? 0.6 : 1
                                  }}
                                  onPress={() => !isLoadingSound && playSound(sound)}
                                  disabled={isLoadingSound}
                                >
                                  {isLoadingSound ? (
                                    <MaterialCommunityIcons name="loading" size={20} color="white" />
                                  ) : (
                                    <Ionicons name="play" size={20} color="white" />
                                  )}
                                </Pressable>
                              ) : (
                                <View style={{flexDirection:'row'}}>
                                  <Pressable 
                                    style={{backgroundColor:'#ffc107',padding:12,borderRadius:25,marginRight:10}}
                                    onPress={isPaused ? resumeSound : pauseSound}
                                  >
                                    <Ionicons name={isPaused ? "play" : "pause"} size={20} color="white" />
                                  </Pressable>
                                  <Pressable 
                                    style={{backgroundColor:'#dc3545',padding:12,borderRadius:25,marginRight:10}}
                                    onPress={stopSound}
                                  >
                                    <Ionicons name="stop" size={20} color="white" />
                                  </Pressable>
                                </View>
                              )}
                            </View>

                            {/* Time Display */}
                            {isPlaying && status && (
                              <View style={{alignItems:'flex-end'}}>
                                <Text style={{fontSize:12,color:'#5F5F5F'}}>
                                  {formatTime(status.positionMillis)} / {formatTime(status.durationMillis)}
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Progress Bar */}
                          {isPlaying && status && status.durationMillis && (
                            <View style={{marginTop:5}}>
                              <Pressable
                                style={{width:'100%',height:6,backgroundColor:'#e0e0e0',borderRadius:3}}
                                onPress={(event) => {
                                  const { locationX } = event.nativeEvent;
                                  const { width } = event.currentTarget.getBoundingClientRect?.() || { width: 300 };
                                  const percentage = locationX / width;
                                  const newPosition = percentage * status.durationMillis;
                                  seekSound(newPosition);
                                }}
                              >
                                <View 
                                  style={{
                                    width: `${getProgressPercentage(status)}%`,
                                    height:'100%',
                                    backgroundColor:'#01c43d',
                                    borderRadius:3
                                  }}
                                />
                              </Pressable>
                            </View>
                          )}
                        </View>

                        {/* Expiry Date */}
                        {sound.expiry_date && (
                          <Text style={{fontSize:12,color:'#5F5F5F',marginTop:5}}>
                            {langState.language === 'hindi' ? 'समाप्ति तिथि: ' : 'Expires: '}{sound.expiry_date}
                          </Text>
                        )}
                      </View>
                    );
                  })
                ) : (
                  <View style={{backgroundColor:'white',padding:20,borderRadius:10,marginBottom:20,alignItems:'center'}}>
                    <Text style={{fontSize:16,color:'#5F5F5F',textAlign:'center'}}>
                      {langState.language === 'hindi' ? 'कोई ध्वनि उपलब्ध नहीं है' : 'No sounds available'}
                    </Text>
                  </View>
                )}

                {/* Sound Therapy Tips */}
                <View style={{backgroundColor:'white',padding:20,borderRadius:10,marginBottom:20}}>
                  <Text style={{fontSize:18,fontWeight:'bold',marginBottom:15,color:'#01c43d'}}>
                    {langState.language === 'hindi' ? 'ध्वनि चिकित्सा सुझाव' : 'Sound Therapy Tips'}
                  </Text>
                  <Text style={{fontSize:14,color:'#2D2D2D',marginBottom:8,lineHeight:20}}>
                    {langState.language === 'hindi' ? '• शांत वातावरण में सुनें' : '• Listen in a quiet environment'}
                  </Text>
                  <Text style={{fontSize:14,color:'#2D2D2D',marginBottom:8,lineHeight:20}}>
                    {langState.language === 'hindi' ? '• आरामदायक स्थिति में बैठें या लेटें' : '• Sit or lie in a comfortable position'}
                  </Text>
                  <Text style={{fontSize:14,color:'#2D2D2D',marginBottom:8,lineHeight:20}}>
                    {langState.language === 'hindi' ? '• गहरी सांस लें और आराम करें' : '• Take deep breaths and relax'}
                  </Text>
                  <Text style={{fontSize:14,color:'#2D2D2D',lineHeight:20}}>
                    {langState.language === 'hindi' ? '• नियमित रूप से सुनें' : '• Listen regularly for best results'}
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
    <FontAwesome6 name="user-gear" size={24} color="#10331b" style={{ width: 30 }} />
    <Text style={{fontSize:10,color:'#10331b',marginTop:2}}>
      {langState.language === 'hindi' ? 'प्रोफाइल' : 'Profile'}
    </Text>
  </Pressable>
  <Pressable style={{ flex: 1, alignItems: 'center', padding: 10 }} onPress={()=>navigation.navigate('HealthPlan')}>
    <Ionicons name="fitness" size={24} color="#10331b" style={{ width: 30 }} />
    <Text style={{fontSize:10,color:'#10331b',marginTop:2}}>
      {langState.language === 'hindi' ? 'स्वास्थ्य' : 'Health'}
    </Text>
  </Pressable>
        <Pressable style={{ flex: 1, alignItems: 'center', padding: 10 }} onPress={()=>navigation.navigate('Medicine')}>
          <MaterialCommunityIcons name="pill" size={24} color="#10331b" style={{ width: 30 }} />
          <Text style={{fontSize:9,color:'#10331b',marginTop:2}}>
            {langState.language === 'hindi' ? 'दवाई' : 'Medicine'}
          </Text>
</Pressable>
  <Pressable style={{ flex: 1, alignItems: 'center', padding: 10 }} onPress={()=>navigation.navigate('Therapy')}>
    <MaterialCommunityIcons name="medical-bag" size={24} color="#10331b" style={{ width: 30 }} />
    <Text style={{fontSize:10,color:'#10331b',marginTop:2}}>
      {langState.language === 'hindi' ? 'चिकित्सा' : 'Therapy'}
    </Text>
  </Pressable>
  <Pressable style={{ flex: 1, alignItems: 'center', padding: 10 }}>
    <MaterialCommunityIcons name="music-note" size={24} color="#01c43d" style={{ width: 30 }} />
    <Text style={{fontSize:10,color:'#01c43d',marginTop:2,fontWeight:'bold'}}>
      {langState.language === 'hindi' ? 'ध्वनि' : 'Sound'}
    </Text>
  </Pressable>
</View>

    </View>
  );
};

export default SoundPage;