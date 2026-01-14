import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    SafeAreaView,
} from "react-native";
import { colors } from '../../config/globall';

const NAVY_BLUE = colors.primaryButton || '#293d55';

const AnomalyDetectionScreen = ({ navigation }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    const sendMessage = () => {
        if (input.trim() === "") return;
        const newMessage = { id: Date.now().toString(), text: input, sender: 'user' };
        setMessages([...messages, newMessage]);
        setInput("");
    };

    const renderMessage = ({ item }) => (
        <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{item.text}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={NAVY_BLUE} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Anomaly Detection</Text>
            </View>

            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messageList}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Write here..."
                        value={input}
                        onChangeText={setInput}
                        multiline
                    />
                    <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                        <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        backgroundColor: NAVY_BLUE,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
    },
    backButton: {
        padding: 5,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '300',
    },
    title: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 15,
    },
    messageList: {
        padding: 15,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 20,
        marginBottom: 10,
        maxWidth: '80%',
        backgroundColor: '#F0F0F0',
        alignSelf: 'flex-start',
    },
    messageText: {
        color: '#333333',
        fontSize: 15,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        fontSize: 16,
        maxHeight: 100,
    },
    sendButton: {
        marginLeft: 10,
        backgroundColor: NAVY_BLUE,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});

export default AnomalyDetectionScreen;
