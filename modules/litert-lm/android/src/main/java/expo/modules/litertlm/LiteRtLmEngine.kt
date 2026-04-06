package expo.modules.litertlm

import android.util.Log
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.Conversation
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.Message
import com.google.ai.edge.litertlm.SamplerConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.File

private const val TAG = "LiteRtLmEngine"

class LiteRtLmEngine {
    private var engine: Engine? = null
    private val mutex = Mutex()

    val isInitialized: Boolean
        get() = engine != null

    suspend fun initialize(modelPath: String) {
        withContext(Dispatchers.IO) {
            val cleanPath = if (modelPath.startsWith("file://")) {
                modelPath.removePrefix("file://")
            } else {
                modelPath
            }

            val file = File(cleanPath)
            if (!file.exists()) {
                throw Exception("Model file not found at: $cleanPath")
            }
            Log.i(TAG, "Model file found: ${file.length() / 1_000_000} MB at $cleanPath")

            Log.i(TAG, "Creating EngineConfig with GPU backend...")
            val config = EngineConfig(
                modelPath = cleanPath,
                backend = Backend.GPU(),
                visionBackend = Backend.GPU()
            )

            Log.i(TAG, "Creating Engine instance...")
            val eng = Engine(config)

            Log.i(TAG, "Calling engine.initialize() — this may take a few minutes on first load...")
            eng.initialize()
            Log.i(TAG, "Engine initialized successfully!")
            engine = eng
        }
    }

    suspend fun analyzeImage(
        imagePath: String,
        prompt: String,
        onPartialResponse: ((String) -> Unit)? = null
    ): String {
        return mutex.withLock {
            val eng = engine ?: throw Exception("Engine not initialized")

            val samplerConfig = SamplerConfig(
                topK = 32,
                topP = 0.95,
                temperature = 0.4,
                seed = 0
            )

            val conversation = eng.createConversation(
                ConversationConfig(
                    samplerConfig = samplerConfig
                )
            )

            val cleanPath = if (imagePath.startsWith("file://")) {
                imagePath.removePrefix("file://")
            } else {
                imagePath
            }

            val message = Message.of(
                Content.ImageFile(cleanPath),
                Content.Text(prompt)
            )

            val fullResponse = StringBuilder()

            withContext(Dispatchers.IO) {
                conversation.sendMessageAsync(message)
                    .collect { msg ->
                        val text = msg.toString()
                        fullResponse.append(text)
                        onPartialResponse?.invoke(text)
                    }
            }

            conversation.close()
            fullResponse.toString()
        }
    }

    fun release() {
        engine?.close()
        engine = null
    }
}
