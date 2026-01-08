package riven.core.service.workflow

import com.google.protobuf.Duration
import io.grpc.Status
import io.grpc.StatusRuntimeException
import io.temporal.api.workflowservice.v1.DescribeNamespaceRequest
import io.temporal.api.workflowservice.v1.RegisterNamespaceRequest
import io.temporal.serviceclient.WorkflowServiceStubs
import org.springframework.stereotype.Service
import java.util.*

@Service
class TemporalNamespaceManager(
    private val workflowServiceStubs: WorkflowServiceStubs
) {

    fun getOrCreateNamespace(workspaceId: UUID): String {
        val namespaceName = "workspace-$workspaceId"

        try {
            workflowServiceStubs.blockingStub()
                .describeNamespace(
                    DescribeNamespaceRequest.newBuilder()
                        .setNamespace(namespaceName)
                        .build()
                )
        } catch (e: StatusRuntimeException) {
            // Temporal uses gRPC requests when communicating with engine, will need to check for gRPC status code
            // NOT_FOUND to determine if namespace does not exist
            if (e.status.code == Status.Code.NOT_FOUND) {
                createNamespace(namespaceName)
            } else {
                throw e
            }
        }

        return namespaceName
    }

    private fun createNamespace(name: String) {
        workflowServiceStubs.blockingStub()
            .registerNamespace(
                RegisterNamespaceRequest.newBuilder()
                    .setNamespace(name)
                    .setWorkflowExecutionRetentionPeriod(
                        Duration.newBuilder().setSeconds(30 * 24 * 60 * 60) // 30 days
                    )
                    .build()
            )
    }
}