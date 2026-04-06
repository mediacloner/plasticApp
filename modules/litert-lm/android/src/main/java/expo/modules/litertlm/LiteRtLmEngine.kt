package expo.modules.litertlm

import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
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

class LiteRtLmEngine {
    private var engine: Engine? = null
    private val mutex = Mutex()

    val isInitialized: Boolean
        get() = engine != null

    suspend fun initialize(modelPath: String) {
        withContext(Dispatchers.IO) {
            val file = File(modelPath)
            if (!file.exists()) {
                throw Exception("Model file not found at: $modelPath")
            }

            val config = EngineConfig(
                modelPath = modelPath,
                backend = Backend.GPU,
                visionBackend = Backend.GPU
            )

            val eng = Engine(config)
            eng.initialize()
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

            // Strip file:// prefix that React Native URIs use
            val cleanPath = if (imagePath.startsWith("file://")) {
                imagePath.removePrefix("file://")
            } else {
                imagePath
            }

            // Build multimodal message: image + text
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
