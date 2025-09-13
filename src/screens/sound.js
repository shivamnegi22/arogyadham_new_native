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
      // Stop current sound if playing
      if (currentSound) {
        await currentSound.unloadAsync();
        setCurrentSound(null);
        setPlayingId(null);
      }

      // Construct the full URL for the sound file
      const soundUrl = `https://admin.arogyapath.in/${sound.file}`;
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: soundUrl },
        { shouldPlay: true }
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
      Alert.alert('Error', 'Failed to play sound');
    }
  };

  const pauseSound = async () => {
    if (currentSound) {
      await currentSound.pauseAsync();
    }
  };

  const resumeSound = async () => {
    if (currentSound) {
      await currentSound.playAsync();
    }
  };

  const stopSound = async () => {
    if (currentSound) {
      await currentSound.unloadAsync();
      setCurrentSound(null);
      setPlayingId(null);
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

  const formatDuration = (millis) => {
    if (!millis) return '0:00';
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
                    
                    return (
                      <View key={sound.id} style={{backgroundColor:'white',padding:20,borderRadius:10,marginBottom:20}}>
                        <Text style={{fontSize:18,fontWeight:'bold',color:'#01c43d',marginBottom:10}}>
                          {langState.language === 'hindi' ? sound.hi_name : sound.name}
                        </Text>
                        
                        {(sound.description || sound.hi_description) && (
                          <Text style={{fontSize:14,color:'#5F5F5F',marginBottom:15,lineHeight:20}}>
                            {langState.language === 'hindi' ? sound.hi_description : sound.description}
                          </Text>
                        )}

                        {/* Audio Controls */}
                        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
                          <View style={{flexDirection:'row',alignItems:'center'}}>
                            {!isPlaying ? (
                              <Pressable 
                                style={{backgroundColor:'#01c43d',padding:12,borderRadius:25,marginRight:10}}
                                onPress={() => playSound(sound)}
                              >
                                <Ionicons name="play" size={20} color="white" />
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

                          {/* Duration Display */}
                          {isPlaying && status && (
                            <View style={{alignItems:'flex-end'}}>
                              <Text style={{fontSize:12,color:'#5F5F5F'}}>
                                {formatDuration(status.positionMillis)} / {formatDuration(status.durationMillis)}
                              </Text>
                              {/* Progress Bar */}
                              <View style={{width:100,height:4,backgroundColor:'#e0e0e0',borderRadius:2,marginTop:5}}>
                                <View 
                                  style={{
                                    width: status.durationMillis ? `${(status.positionMillis / status.durationMillis) * 100}%` : '0%',
                                    height:'100%',
                                    backgroundColor:'#01c43d',
                                    borderRadius:2
                                  }}
                                />
                              </View>
                            </View>
                          )}
                        </View>

                        {/* Expiry Date */}
                        {sound.expiry_date && (
                          <Text style={{fontSize:12,color:'#5F5F5F',marginTop:10}}>
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
          <Text style={{fontSize:10,color:'#10331b',marginTop:2}}>
            {langState.language === 'hindi' ? 'दवाई' : 'Medicine'}
          </Text>
        </Pressable>
        <Pressable style={{ flex: 1, alignItems: 'center', padding: 10 }}>
          <MaterialCommunityIcons name="music-note" size={30} color="#01c43d" style={{ width: 40 }} />
          <Text style={{fontSize:10,color:'#01c43d',marginTop:2,fontWeight:'bold'}}>
            {langState.language === 'hindi' ? 'ध्वनि' : 'Sound'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default SoundPage;