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

const ClinicalDecisionSupportScreen = ({ navigation }) => {
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
                <Text style={styles.title}>Clinical Decision Support</Text>
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
                        placeholder="Type your clinical query..."
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
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: NAVY_BLUE,
    },
    messageText: {
        color: '#1E293B',
        fontSize: 15,
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 10,
        fontSize: 16,
        maxHeight: 120,
        color: '#1E293B',
    },
    sendButton: {
        marginLeft: 12,
        backgroundColor: NAVY_BLUE,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});

export default ClinicalDecisionSupportScreen;
