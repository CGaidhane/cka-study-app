import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, BookOpen, Terminal, FileCode, AlertTriangle, Brain, ListChecks,
  CalendarDays, Zap, Server, Boxes, Cpu, Network, Database, Shield, Wrench, Settings,
  Copy, Check, ChevronDown, Search, RotateCcw, Trash2, Eye, Lightbulb, LifeBuoy,
  Target, ArrowRight, Flame, Activity, Volume2, VolumeX, Sparkles
} from "lucide-react";

/* ---------------- tokens ---------------- */
const C = {
  bg: "#07080b", surface: "#13151b", surface2: "#1b1e26",
  border: "#272b36", borderSoft: "#1f232c",
  text: "#eef0f5", textDim: "#9aa1ad", textFaint: "#6b7280", code: "#cdd3df",
};
const CAT = {
  Architecture: { c: "#60a5fa", icon: Server },
  Workloads: { c: "#a78bfa", icon: Boxes },
  Scheduling: { c: "#fbbf24", icon: Cpu },
  Networking: { c: "#22d3ee", icon: Network },
  Storage: { c: "#34d399", icon: Database },
  Security: { c: "#fb7185", icon: Shield },
  Troubleshooting: { c: "#f472b6", icon: Wrench },
  "Cluster maintenance": { c: "#38bdf8", icon: Settings },
};
const CATEGORIES = Object.keys(CAT);
const LEVELS = {
  must: { label: "must-know", c: "#34d399" },
  good: { label: "good-to-know", c: "#fbbf24" },
  advanced: { label: "advanced", c: "#a78bfa" },
};
const STATUS = {
  know: { label: "Know", c: "#34d399" },
  weak: { label: "Weak", c: "#fbbf24" },
  revise: { label: "Later", c: "#60a5fa" },
};
const QTYPES = {
  concept: { label: "Concept", c: "#60a5fa" },
  scenario: { label: "Scenario", c: "#a78bfa" },
  troubleshoot: { label: "Troubleshoot", c: "#fb7185" },
  interview: { label: "Interview", c: "#fbbf24" },
};
const SECTIONS = [
  { id: "dash", label: "Dashboard", icon: LayoutDashboard },
  { id: "crash", label: "Crash Course", icon: BookOpen },
  { id: "cmd", label: "Command Lab", icon: Terminal },
  { id: "yaml", label: "YAML", icon: FileCode },
  { id: "traps", label: "Exam Traps", icon: AlertTriangle },
  { id: "quiz", label: "Quiz", icon: Brain },
  { id: "gap", label: "Gap Check", icon: ListChecks },
  { id: "cram", label: "7-Day Cram", icon: CalendarDays },
  { id: "rapid", label: "Rapid Revision", icon: Zap },
];

/* ---------------- concepts ---------------- */
const CONCEPTS = [
  { key: "cluster", name: "Cluster", category: "Architecture", level: "must",
    what: `A set of machines (nodes) managed as one to run containerized workloads.`,
    why: `One app rarely fits one machine — you need pooled compute plus a brain to schedule it.`,
    when: `Always. It's the unit you operate.`,
    example: `kubectl get nodes  → the machines in your cluster`,
    analogy: `A kitchen brigade — many cooks (nodes) coordinated by one head chef (control plane).`,
    productionExample: `Lose etcd quorum (2 of 3 control-plane nodes die) and the whole cluster freezes for changes: running pods keep serving traffic, but nothing new schedules, scales, or self-heals until quorum returns.`,
    interviewTrap: `"Is the cluster down when the control plane is down?" — running workloads survive; you just can't change anything. Saying "everything dies" is the wrong answer.` },
  { key: "node", name: "Node", category: "Architecture", level: "must",
    what: `A single machine (VM or physical) that runs pods.`,
    why: `Pods need somewhere to actually execute — nodes provide CPU, memory and disk.`,
    when: `Need more capacity → add nodes. Less → remove them.`,
    example: `kubectl describe node <name>  → capacity, conditions, running pods`,
    analogy: `One cook's station. More stations = more dishes in parallel.`,
    productionExample: `A node's disk fills with logs and old images → kubelet flips to DiskPressure, stops scheduling, and starts evicting pods. You see a pile of Evicted pods and confused on-call engineers.`,
    interviewTrap: `They blur "node NotReady" with "pods dead." Pods get a grace period (default ~5 min) before the controller reschedules them — the node going NotReady isn't instant pod death.` },
  { key: "controlplane", name: "Control plane", category: "Architecture", level: "must",
    what: `The brain: API server, scheduler, controller-manager and etcd (+ cloud-controller).`,
    why: `Something must decide what runs where, store desired state, and reconcile reality to it.`,
    when: `Always running. You mostly talk to it through the API server.`,
    example: `kube-apiserver is the front door — every request goes through it.`,
    analogy: `Head chef + the order-ticket board + the recipe book.`,
    productionExample: `kube-apiserver certs expire one year after a kubeadm install → every kubectl call across the org fails with x509 errors at once. Fix: kubeadm certs renew all, then restart the control-plane pods.`,
    interviewTrap: `They expect you to separate the parts: a scheduler outage stops new placements but the API still serves reads/writes; an etcd outage stops everything. Treating the control plane as one monolith is the tell.` },
  { key: "worker", name: "Worker node", category: "Architecture", level: "must",
    what: `A node running kubelet + kube-proxy + a container runtime that hosts your pods.`,
    why: `Separates deciding (control plane) from doing (workers).`,
    when: `Where your actual app containers live.`,
    example: `kubelet talks to the API server and starts containers via containerd.`,
    analogy: `The line cooks who actually plate what the chef ordered.`,
    productionExample: `containerd crashes on a busy worker → all its pods die and reschedule onto the remaining nodes, briefly overloading them and tripping a cascade of evictions if requests/limits aren't set.`,
    interviewTrap: `"What runs your containers?" Kubelet does NOT run containers itself — it instructs the CRI runtime (containerd/CRI-O). Naming kubelet as the runtime is a red flag.` },
  { key: "namespace", name: "Namespace", category: "Architecture", level: "must",
    what: `A virtual slice of the cluster for grouping and isolating resources.`,
    why: `Multi-team / multi-env separation, scoped names, quotas and RBAC.`,
    when: `Splitting dev/stage/prod or teams inside one cluster.`,
    example: `kubectl get pods -n payments`,
    analogy: `Apartments in one building — separate mailboxes, shared plumbing. Nodes, PVs and ClusterRoles are NOT namespaced.`,
    productionExample: `A team's namespace with no ResourceQuota runs away and eats all cluster CPU, starving every other team. ResourceQuota + LimitRange per namespace is the guardrail.`,
    interviewTrap: `Deleting a namespace deletes everything inside it — and it can hang in Terminating forever on a stuck finalizer (often a broken webhook/CRD). They test whether you know namespaces don't isolate the network by default.` },
  { key: "labels", name: "Labels", category: "Architecture", level: "must",
    what: `Key/value tags on objects, used for grouping and selection.`,
    why: `This is how Kubernetes finds related objects (a Service finds its pods).`,
    when: `Everywhere — they're the glue.`,
    example: `app: web   tier: frontend`,
    analogy: `Hashtags — searchable, used to group things.`,
    productionExample: `A one-character typo (app=web instead of app=web) silently drops a pod out of its Service's endpoints. No error anywhere — just a slow trickle of failed requests.`,
    interviewTrap: `The classic "the Service is up but returns nothing" scenario is almost always a label/selector mismatch. They want you to reach for kubectl get endpoints, not restart pods.` },
  { key: "selectors", name: "Selectors", category: "Architecture", level: "must",
    what: `Queries that match objects by their labels.`,
    why: `Loose coupling — a Service targets whatever matches, not named pods.`,
    when: `Service→pods, Deployment→pods, NetworkPolicy targeting.`,
    example: `selector: { app: web }  → every pod labeled app=web`,
    analogy: `A search filter: "show me everything tagged #web." A Deployment's selector must match its pod template labels — and it's immutable.`,
    productionExample: `Mid-migration a team tries to re-target a Deployment's selector and hits "field is immutable" — forcing a delete + recreate (and a brief outage) they didn't plan for.`,
    interviewTrap: `selector.matchLabels is immutable after creation and must be a subset of the pod template labels. "Just edit the selector" is wrong.` },
  { key: "annotations", name: "Annotations", category: "Architecture", level: "good",
    what: `Non-identifying metadata (key/value) for tools — not for selection.`,
    why: `Attach info (build IDs, controller hints, descriptions) without affecting matching.`,
    when: `Ingress controller config, change-cause, tooling metadata.`,
    example: `nginx.ingress.kubernetes.io/rewrite-target: /`,
    analogy: `Margin notes — readable info, but you don't search by them. Labels identify; annotations describe.`,
    productionExample: `Ingress behavior (URL rewrites, max body size, timeouts) lives entirely in controller annotations. A missing proxy-body-size annotation = 413 errors on uploads in prod.`,
    interviewTrap: `You cannot select pods by annotations — only labels. They'll ask you to "select pods by annotation" to see if you catch it.` },
  { key: "pod", name: "Pod", category: "Workloads", level: "must",
    what: `Smallest deployable unit — one or more containers sharing network and storage.`,
    why: `Some containers must live together (app + sidecar), sharing localhost and volumes.`,
    when: `Rarely created directly — usually via a controller.`,
    example: `A web container + a log-shipper sidecar in one pod, sharing localhost.`,
    analogy: `A lunchbox — the containers inside travel together and share compartments. Pods are mortal: never rely on a pod IP staying.`,
    productionExample: `An app hardcodes a peer's pod IP in config. The peer reschedules, gets a new IP, and the integration silently breaks until someone notices the dead connections.`,
    interviewTrap: `"How do you give a pod a stable IP?" — you don't. You put a Service in front (or a headless Service for StatefulSet identity). Pods are ephemeral by design.` },
  { key: "replicaset", name: "ReplicaSet", category: "Workloads", level: "must",
    what: `Keeps N identical pod copies running.`,
    why: `Self-healing + scale — if a pod dies, it makes another.`,
    when: `Almost never directly — Deployments manage ReplicaSets for you.`,
    example: `replicas: 3  → always 3 pods; kill one, a new one appears.`,
    analogy: `A photocopier set to "always keep 3 copies on the desk."`,
    productionExample: `A botched manual edit leaves an orphaned ReplicaSet that keeps spawning pods, fighting the Deployment's own ReplicaSet — double the pods, weird load-balancing, confused dashboards.`,
    interviewTrap: `You essentially never manage ReplicaSets directly. Saying "I scale the ReplicaSet" signals you're not using Deployments the way real teams do.` },
  { key: "deployment", name: "Deployment", category: "Workloads", level: "must",
    what: `Declarative manager for ReplicaSets with rolling updates and rollbacks.`,
    why: `Ship new versions with zero downtime and undo the bad ones.`,
    when: `The default for stateless apps.`,
    example: `kubectl set image deploy/web web=nginx:1.27  → rolling update`,
    analogy: `A shift manager who swaps in new staff gradually and can call the old crew back.`,
    productionExample: `A bad image ships with maxUnavailable cranked high and no readiness probe → half the fleet goes down before anything notices. Tuning maxSurge/maxUnavailable + a real readinessProbe prevents the mass outage.`,
    interviewTrap: `rollout undo reverts the pod template (image, args, env), NOT external ConfigMaps/Secrets. They ask "what does undo actually restore?" to catch the assumption that it rolls back config too.` },
  { key: "daemonset", name: "DaemonSet", category: "Workloads", level: "good",
    what: `Runs exactly one pod per node (or per matching node).`,
    why: `Node-level agents (logging, monitoring, CNI) must run everywhere.`,
    when: `Per-node infra: fluentd, node-exporter, network plugins.`,
    example: `A log collector pod auto-appears on every new node you add.`,
    analogy: `A smoke detector in every room — add a room, it gets one too.`,
    productionExample: `A log-shipper DaemonSet with no memory limit OOMs nodes one by one during a log spike — because it runs everywhere, the failure spreads cluster-wide instead of staying contained.`,
    interviewTrap: `DaemonSet pods tolerate many node taints and bypass normal spreading. "Why did a pod land on a tainted/control-plane node?" — often a DaemonSet with broad tolerations.` },
  { key: "statefulset", name: "StatefulSet", category: "Workloads", level: "good",
    what: `Manages stateful pods with stable identity, ordered rollout and sticky storage.`,
    why: `Databases need stable network names and their own disk per replica.`,
    when: `Kafka, Postgres — anything where pod-0 ≠ pod-1.`,
    example: `Pods named db-0, db-1 with sticky PVCs data-db-0, data-db-1.`,
    analogy: `Assigned seats with name tags — each person keeps their seat and locker.`,
    productionExample: `Scaling a StatefulSet down does NOT delete its PVCs by default → orphaned EBS/PD volumes quietly pile up and the cloud bill creeps for months.`,
    interviewTrap: `Pod identity + PVC are sticky: delete db-1 and it comes back as db-1 with the same volume. They test whether you know scale-down leaves volumes behind on purpose.` },
  { key: "probes", name: "Liveness / Readiness / Startup probes", category: "Workloads", level: "must",
    what: `Health checks. Liveness = restart if dead. Readiness = pull from Service if not ready. Startup = give slow boots time before liveness kicks in.`,
    why: `Auto-recover hung apps, avoid sending traffic to not-ready pods, don't kill slow starters.`,
    when: `Liveness for deadlocks, readiness for warmup/deps, startup for slow legacy apps.`,
    example: `readiness on /healthz fails → pod leaves the load balancer but is NOT restarted.`,
    analogy: `Liveness = "is it breathing? if not, reboot." Readiness = "ready for customers?" Startup = "still waking up, don't poke yet."`,
    productionExample: `A liveness probe that checks a downstream database creates a cluster-wide restart storm during a DB blip — every pod "fails" liveness and reboots in a loop. Readiness would have been the correct, harmless choice.`,
    interviewTrap: `Liveness failing RESTARTS; readiness failing only removes from endpoints (no restart). Swapping these two is the single most common interview kill-shot.` },
  { key: "configmap", name: "ConfigMap", category: "Workloads", level: "must",
    what: `Non-secret config (key/values or files) decoupled from the image.`,
    why: `Same image, different config per environment — no rebuilds.`,
    when: `Feature flags, URLs, config files, env vars.`,
    example: `Mount as env vars or as a file at /etc/config.`,
    analogy: `A sticky note of settings taped to the container, swappable any time. Not secret — base64 isn't encryption.`,
    productionExample: `An engineer edits a ConfigMap used as env vars and expects pods to pick it up. Nothing happens — env vars are injected at start. The "fix" silently does nothing until the next rollout.`,
    interviewTrap: `ConfigMaps consumed as env vars need a pod restart to take effect; mounted as files they update in place (with a sync delay). They ask "does changing a ConfigMap update running pods?" — it depends how it's consumed.` },
  { key: "requests", name: "Requests", category: "Scheduling", level: "must",
    what: `The CPU/memory a container is guaranteed — used by the scheduler to place pods.`,
    why: `The scheduler must know how much to reserve so nodes aren't oversold.`,
    when: `Always set them — unset requests = scheduling roulette.`,
    example: `requests: { cpu: 250m, memory: 256Mi }`,
    analogy: `A dinner reservation — the table is held for you.`,
    productionExample: `No requests set → the scheduler bin-packs far too many pods onto each node → CPU contention and p99 latency spikes the moment real traffic arrives.`,
    interviewTrap: `Requests (not limits) drive scheduling. "Which value does the scheduler use to place a pod?" → requests. People reflexively say limits.` },
  { key: "limits", name: "Limits", category: "Scheduling", level: "must",
    what: `The hard ceiling a container may use. Over memory → OOMKilled. Over CPU → throttled.`,
    why: `Stop one noisy pod from starving the whole node.`,
    when: `Always, to protect the neighbors.`,
    example: `limits: { memory: 512Mi }  → uses 600Mi → killed.`,
    analogy: `A spending cap on a card — hit it and you're throttled (CPU) or kicked out (memory). requests==limits → Guaranteed QoS.`,
    productionExample: `A slow memory leak creeps up to the limit → OOMKilled → CrashLoopBackOff. The smoking gun in describe is exit code 137 and reason OOMKilled.`,
    interviewTrap: `Over CPU = throttled (no kill); over memory = killed. They flip these. Also: requests==limits gives Guaranteed QoS (evicted last); requests<limits is Burstable.` },
  { key: "taints", name: "Taints", category: "Scheduling", level: "good",
    what: `A repellent on a node: "don't schedule here unless you tolerate me."`,
    why: `Reserve nodes (GPU, control-plane) for specific workloads.`,
    when: `Dedicated node pools; keeping pods off control-plane nodes.`,
    example: `kubectl taint nodes gpu1 gpu=true:NoSchedule`,
    analogy: `A "staff only" sign on a door. Pairs with tolerations.`,
    productionExample: `Someone removes the control-plane node's NoSchedule taint to "free up capacity" → app pods schedule onto masters → control-plane components get starved and the cluster wobbles.`,
    interviewTrap: `Taint effects matter: NoSchedule (block new), PreferNoSchedule (best-effort), NoExecute (also EVICTS already-running pods). They specifically test NoExecute.` },
  { key: "tolerations", name: "Tolerations", category: "Scheduling", level: "good",
    what: `A pod's permission to land on a tainted node.`,
    why: `Lets chosen pods bypass the repellent.`,
    when: `Scheduling GPU jobs onto tainted GPU nodes.`,
    example: `toleration for gpu=true:NoSchedule lets the pod schedule there.`,
    analogy: `The staff keycard that opens the "staff only" door. It only PERMITS — it doesn't attract. Use affinity to pull pods in.`,
    productionExample: `A blanket toleration (operator: Exists with no key) lets a pod ignore ALL taints — including DiskPressure/NotReady — so it happily schedules onto broken nodes and fails mysteriously.`,
    interviewTrap: `A toleration only permits; it never attracts. "I added a toleration so my pod runs on the GPU node" is incomplete — without nodeAffinity/nodeSelector it can land anywhere.` },
  { key: "nodeaffinity", name: "Node affinity", category: "Scheduling", level: "good",
    what: `Rules that attract pods to nodes by node labels (soft/preferred or hard/required).`,
    why: `Place pods on the right hardware or zone.`,
    when: `"Run on SSD nodes" / "prefer zone-a".`,
    example: `requiredDuringScheduling...: disktype=ssd`,
    analogy: `"I want a window seat" — a preference or a hard requirement. Taints repel; affinity attracts.`,
    productionExample: `required node affinity with no matching nodes leaves pods Pending forever during a zone outage. preferredDuringScheduling would have let them degrade into another zone instead.`,
    interviewTrap: `required vs preferred: required can wedge pods Pending indefinitely. "Which would you use for HA across zones?" → preferred (soft), so it survives a zone loss.` },
  { key: "podaffinity", name: "Pod affinity", category: "Scheduling", level: "advanced",
    what: `Schedule a pod near other pods (by their labels) within a topology (node/zone).`,
    why: `Co-locate chatty services to cut latency.`,
    when: `Web pod near its cache pod.`,
    example: `affinity to app=cache in the same zone.`,
    analogy: `"Seat me next to my friend."`,
    productionExample: `Over-aggressive pod affinity collapses all replicas onto one node/zone for "low latency" — then that node dies and takes the entire service with it.`,
    interviewTrap: `topologyKey is the whole game: affinity by hostname vs by zone changes your blast radius completely. They ask what topologyKey you'd pick and why.` },
  { key: "antiaffinity", name: "Anti-affinity", category: "Scheduling", level: "advanced",
    what: `Keep a pod away from pods with given labels.`,
    why: `Spread replicas across nodes/zones for high availability.`,
    when: `Don't put all DB replicas on one node.`,
    example: `anti-affinity on app=db per hostname → one db per node.`,
    analogy: `"Don't seat the loud group together." Or use topologySpreadConstraints.`,
    productionExample: `required anti-affinity on hostname with more replicas than nodes → the extra replicas sit Pending forever and your autoscaler thrashes trying to satisfy an impossible constraint.`,
    interviewTrap: `Hard (required) anti-affinity can block scaling. topologySpreadConstraints is the modern, softer answer — knowing that distinction scores points.` },
  { key: "service", name: "Service", category: "Networking", level: "must",
    what: `A stable virtual IP + DNS name that load-balances to a set of pods.`,
    why: `Pods come and go with changing IPs — clients need one fixed address.`,
    when: `Any time something must reach your pods reliably.`,
    example: `ClusterIP service "web" round-robins to all app=web pods.`,
    analogy: `A front-desk phone number — staff change, the number doesn't. Types: ClusterIP, NodePort, LoadBalancer, ExternalName.`,
    productionExample: `A Service with a valid selector but zero READY pods returns connection refused — readiness gates the endpoints list, so failing probes silently empty the Service behind a healthy-looking ClusterIP.`,
    interviewTrap: `The Service object doesn't load-balance — kube-proxy (iptables/IPVS) programs the rules. And ClusterIP isn't reachable from outside the cluster. Both are favorite gotchas.` },
  { key: "ingress", name: "Ingress", category: "Networking", level: "good",
    what: `HTTP(S) routing rules (host/path) into the cluster, handled by an ingress controller.`,
    why: `One entry point + TLS + name/path routing beats a LoadBalancer per service.`,
    when: `Exposing multiple HTTP services under domains/paths.`,
    example: `shop.com/api → api-svc,  shop.com/ → web-svc`,
    analogy: `A building receptionist routing visitors by name. Does nothing without a controller (nginx, traefik).`,
    productionExample: `A TLS Secret lives in the wrong namespace, so the controller can't serve the cert → users get NET::ERR_CERT_AUTHORITY_INVALID in prod even though the Ingress "looks fine."`,
    interviewTrap: `An Ingress object does nothing without a running ingress controller, and the referenced TLS Secret must be in the SAME namespace as the Ingress. They test both.` },
  { key: "dns", name: "DNS (CoreDNS)", category: "Networking", level: "must",
    what: `CoreDNS gives every service a name like svc.namespace.svc.cluster.local.`,
    why: `Hardcoding IPs is fragile — names are stable and discoverable.`,
    when: `Service-to-service calls inside the cluster.`,
    example: `curl http://web.default.svc.cluster.local`,
    analogy: `A phone book for the cluster — look up by name, get the number.`,
    productionExample: `Under-scaled CoreDNS plus ndots:5 (every short name triggers ~5 lookups through the search domains) → intermittent resolution failures and latency across every service. NodeLocal DNSCache + more CoreDNS replicas fix it.`,
    interviewTrap: `The ndots:5 search-domain behavior is why external lookups (e.g. api.github.com) are slow from inside a pod. They ask "why is an external DNS lookup slow in a pod?" — it's the search-domain amplification.` },
  { key: "pv", name: "PersistentVolume (PV)", category: "Storage", level: "must",
    what: `A cluster-level piece of real storage (EBS, NFS…), provisioned by admin or dynamically.`,
    why: `Decouple actual storage from pods so data survives pod death.`,
    when: `Any data that must outlive a pod.`,
    example: `A 10Gi EBS-backed PV available to be claimed.`,
    analogy: `A storage unit that exists independent of any tenant. PV = the supply.`,
    productionExample: `A PV with reclaimPolicy: Delete has its underlying cloud disk destroyed the instant its PVC is deleted — someone runs kubectl delete pvc on the wrong namespace and the data is gone.`,
    interviewTrap: `Reclaim policies: Retain (keep disk, manual cleanup) vs Delete (destroy disk) vs Recycle (deprecated). "What happens to the disk when the PVC is deleted?" depends on this.` },
  { key: "pvc", name: "PersistentVolumeClaim (PVC)", category: "Storage", level: "must",
    what: `A pod's request for storage (size + access mode) that binds to a PV.`,
    why: `Apps shouldn't know storage details — they just ask for "10Gi RWO".`,
    when: `Mounting durable storage into a pod.`,
    example: `PVC "data" 10Gi RWO → binds to a matching PV → mounted at /data.`,
    analogy: `The rental agreement that claims a unit. Pods mount PVCs, never PVs directly. PVC = the demand.`,
    productionExample: `During a node failover a ReadWriteOnce PVC is still attached to the dead node → the new pod hangs in ContainerCreating with a "Multi-Attach error" because block storage can't mount on two nodes at once.`,
    interviewTrap: `Access modes (RWO / ROX / RWX) and whether your backend even supports RWX — most cloud block storage is RWO only; RWX needs NFS/CephFS/EFS. They ask how to share one volume across pods on different nodes.` },
  { key: "storageclass", name: "StorageClass", category: "Storage", level: "must",
    what: `A template for dynamic provisioning (provisioner, params, reclaim policy).`,
    why: `Auto-create PVs on demand — no manual pre-provisioning.`,
    when: `Self-service storage; gp3 / fast-ssd tiers.`,
    example: `PVC with storageClassName: fast-ssd → a PV is auto-created.`,
    analogy: `A vending machine for storage units — pick a tier, one appears. No class + no matching PV → PVC stuck Pending.`,
    productionExample: `volumeBindingMode: Immediate provisions a disk before the pod is scheduled, often in the WRONG zone → the pod can never attach it. Switching to WaitForFirstConsumer binds after scheduling, in the right zone.`,
    interviewTrap: `WaitForFirstConsumer vs Immediate — the cross-zone "PVC bound but pod won't schedule / can't attach" bug is a CKA favorite.` },
  { key: "secret", name: "Secret", category: "Security", level: "must",
    what: `Like a ConfigMap but for sensitive data — base64-encoded, can be encrypted at rest.`,
    why: `Keep passwords/tokens/keys out of images and plaintext manifests.`,
    when: `DB passwords, API tokens, TLS certs.`,
    example: `type: kubernetes.io/tls for cert+key, mounted into the pod.`,
    analogy: `A locked drawer vs the ConfigMap's open sticky note. base64 ≠ encrypted — add encryption at rest + RBAC.`,
    productionExample: `Secrets sit unencrypted in etcd by default. An etcd backup ends up in an S3 bucket with loose permissions → every credential in the cluster is now readable in plaintext.`,
    interviewTrap: `"Secrets are encrypted by default" is FALSE — base64 is encoding, not encryption. You must configure an EncryptionConfiguration for encryption at rest. They love this one.` },
  { key: "rbac", name: "RBAC", category: "Security", level: "must",
    what: `Role-Based Access Control: who can do what on which resources.`,
    why: `Least privilege — stop accidental or malicious cluster-wide damage.`,
    when: `Always, in shared/prod clusters.`,
    example: `Role allows get/list pods in dev; a RoleBinding grants it to a user.`,
    analogy: `Building keycards — each opens only certain doors. Pieces: Role/ClusterRole (perms) + RoleBinding/ClusterRoleBinding (who).`,
    productionExample: `A CI ServiceAccount gets a ClusterRoleBinding to cluster-admin "to make the pipeline work." The token later leaks → full cluster takeover. Scope it to exactly the verbs/resources/namespace it needs.`,
    interviewTrap: `A RoleBinding can reference a ClusterRole to grant those permissions within ONE namespace (reusable perms, scoped grant). They test the Role-vs-ClusterRole + binding combinations.` },
  { key: "serviceaccount", name: "ServiceAccount", category: "Security", level: "must",
    what: `An identity for processes inside pods to talk to the API server.`,
    why: `Pods need authenticated, scoped access — not your human credentials.`,
    when: `Apps/controllers that call the Kubernetes API.`,
    example: `Pod uses SA "ci-bot"; RBAC grants it deploy rights.`,
    analogy: `A robot employee badge, separate from human staff badges. The default SA auto-mounts — lock it down if unused.`,
    productionExample: `Every pod auto-mounts the default SA token at /var/run/secrets/... — a compromised app can use it as a lateral-movement foothold. Set automountServiceAccountToken: false where the API isn't needed.`,
    interviewTrap: `Every pod gets the default SA unless told otherwise. "How does a compromised pod talk to the API?" → the auto-mounted SA token. They test whether you'd disable it.` },
  { key: "cordon", name: "Cordon", category: "Cluster maintenance", level: "must",
    what: `Mark a node unschedulable — no new pods, existing ones stay.`,
    why: `Stop adding work before maintenance.`,
    when: `Step 1 of node maintenance.`,
    example: `kubectl cordon node1`,
    analogy: `Stop seating new customers; current diners keep eating.`,
    productionExample: `An engineer cordons a node for maintenance and forgets to uncordon it. Capacity silently shrinks; days later pods start sitting Pending and nobody connects it to the forgotten cordon.`,
    interviewTrap: `Cordon does NOT move existing pods — it only blocks new ones. They contrast cordon (block) with drain (block + evict) to see if you conflate them.` },
  { key: "drain", name: "Drain", category: "Cluster maintenance", level: "must",
    what: `Cordon + safely evict existing pods (respecting PodDisruptionBudgets).`,
    why: `Empty a node before reboot/upgrade/removal.`,
    when: `Before patching or decommissioning a node.`,
    example: `kubectl drain node1 --ignore-daemonsets --delete-emptydir-data`,
    analogy: `Politely walk diners to other tables, then close the section. Drain = cordon + evict.`,
    productionExample: `Draining a node hosting a quorum member (etcd/Zookeeper) without respecting PodDisruptionBudgets takes the cluster below quorum and causes a real outage — the PDB exists precisely to block that.`,
    interviewTrap: `--ignore-daemonsets is required (DaemonSet pods can't be evicted normally) and a PDB can LEGITIMATELY block a drain. "My drain is hanging" is often a PDB doing its job, not a bug.` },
  { key: "uncordon", name: "Uncordon", category: "Cluster maintenance", level: "must",
    what: `Mark a node schedulable again.`,
    why: `Return it to the pool after maintenance.`,
    when: `After drain + reboot/upgrade.`,
    example: `kubectl uncordon node1`,
    analogy: `Reopen the section and start seating again.`,
    productionExample: `After a rolling node upgrade, one node is never uncordoned. The cluster autoscaler thinks capacity exists (the node is Ready) while nothing actually schedules there — capacity math quietly drifts.`,
    interviewTrap: `Uncordon only re-enables scheduling for NEW pods; it won't pull previously-evicted pods back onto the node. They check if you expect workloads to "return."` },
  { key: "etcd", name: "etcd backup / restore", category: "Cluster maintenance", level: "advanced",
    what: `etcd is the cluster's source of truth — snapshot it and restore to recover.`,
    why: `Lose etcd = lose all cluster state. Backups are your lifeline.`,
    when: `Before upgrades; disaster recovery; a CKA exam favourite.`,
    example: `ETCDCTL_API=3 etcdctl snapshot save snap.db (with certs + endpoints)`,
    analogy: `A save-game file for the whole cluster. Restore creates a new data dir — point etcd at it.`,
    productionExample: `etcd sits on a slow/contended disk → fsync latency climbs → apiserver requests time out and leader elections flap. The whole control plane feels sluggish even though "etcd is up." etcd is brutally latency-sensitive — give it fast, dedicated disks.`,
    interviewTrap: `Restore creates a NEW data dir and you must update the etcd static-pod manifest to point at it (and you need the exact snapshot + matching certs + --endpoints). "Just run snapshot restore" without the manifest step is incomplete.` },
  { key: "troubleshoot", name: "Troubleshooting basics", category: "Troubleshooting", level: "must",
    what: `The describe → logs → events → exec loop to find why things break.`,
    why: `Most failures show up in events, logs or describe before anything else.`,
    when: `Pod not Running/Ready, crashloops, pending pods.`,
    example: `describe pod (events) → logs (+ --previous) → get events → exec in`,
    analogy: `A doctor: vitals (describe), symptoms (logs), history (events), then poke around (exec).`,
    productionExample: `A pod stuck in ContainerCreating has NO logs because the container never started — it's almost always a volume mount, missing Secret/ConfigMap, or CNI/IP-allocation problem. describe's events name the culprit; chasing logs wastes time.`,
    interviewTrap: `Where you look first reveals seniority: no logs + Pending/ContainerCreating = a scheduling/mount/CNI issue, not an app bug. Jumping straight to kubectl logs on a never-started container is the giveaway.` },
];

/* ---------------- commands ---------------- */
const CMD_CATS = ["Inspect", "Create & apply", "Update", "Delete", "Debug", "Nodes & scheduling", "DNS & CNI", "Cluster health", "Config & context", "RBAC", "Exam speed"];
const CMD_CAT_COLOR = {
  Inspect: "#60a5fa", "Create & apply": "#34d399", Update: "#fbbf24", Delete: "#fb7185",
  Debug: "#f472b6", "Nodes & scheduling": "#38bdf8", "DNS & CNI": "#2dd4bf", "Cluster health": "#f97316",
  "Config & context": "#a78bfa", RBAC: "#22d3ee", "Exam speed": "#f59e0b",
};
const COMMANDS = [
  { cat: "Inspect", cmd: `kubectl get pods -A -o wide`, meaning: `Every pod across namespaces + node & IP`, when: `Quick cluster-wide glance` },
  { cat: "Inspect", cmd: `kubectl describe pod <p>`, meaning: `Full detail incl. the events section`, when: `First stop when a pod misbehaves` },
  { cat: "Inspect", cmd: `kubectl get all -n <ns>`, meaning: `Common resources in a namespace`, when: `Fast overview of one namespace` },
  { cat: "Inspect", cmd: `kubectl get events --sort-by=.metadata.creationTimestamp`, meaning: `Recent cluster events, newest last`, when: `Find what just broke` },
  { cat: "Inspect", cmd: `kubectl get pods -l app=web --show-labels`, meaning: `Filter by label + show labels`, when: `Debug selectors` },
  { cat: "Inspect", cmd: `kubectl explain <res> --recursive`, meaning: `Full field schema, offline`, when: `Recall YAML fields (exam gold)` },
  { cat: "Inspect", cmd: `kubectl api-resources`, meaning: `Resource types, short names, namespaced?`, when: `Know what's cluster vs namespace scoped` },
  { cat: "Inspect", cmd: `kubectl get pod <p> -o yaml`, meaning: `The full live spec`, when: `See what's really applied` },
  { cat: "Create & apply", cmd: `kubectl apply -f file.yaml`, meaning: `Declarative create/update`, when: `The standard workflow` },
  { cat: "Create & apply", cmd: `kubectl create deploy web --image=nginx`, meaning: `Quick imperative deployment`, when: `Fast scaffolding` },
  { cat: "Create & apply", cmd: `kubectl run nginx --image=nginx --dry-run=client -o yaml`, meaning: `Generate YAML without creating`, when: `Exam template generator` },
  { cat: "Create & apply", cmd: `kubectl run tmp --image=busybox --rm -it -- sh`, meaning: `Throwaway debug pod`, when: `DNS / network tests` },
  { cat: "Create & apply", cmd: `kubectl expose deploy web --port=80`, meaning: `Make a Service for a deployment`, when: `Wire up access fast` },
  { cat: "Update", cmd: `kubectl edit deploy web`, meaning: `Live edit in your editor`, when: `Quick patch` },
  { cat: "Update", cmd: `kubectl set image deploy/web web=nginx:1.27`, meaning: `Rolling image update`, when: `Ship a new version` },
  { cat: "Update", cmd: `kubectl scale deploy web --replicas=5`, meaning: `Change replica count`, when: `Scale fast` },
  { cat: "Update", cmd: `kubectl rollout status deploy/web`, meaning: `Watch a rollout finish`, when: `Confirm it landed` },
  { cat: "Update", cmd: `kubectl rollout undo deploy/web`, meaning: `Roll back to previous`, when: `Undo a bad deploy` },
  { cat: "Update", cmd: `kubectl rollout history deploy/web`, meaning: `List revisions`, when: `Pick a rollback target` },
  { cat: "Update", cmd: `kubectl label pod web env=prod --overwrite`, meaning: `Add / change a label`, when: `Fix selection` },
  { cat: "Delete", cmd: `kubectl delete -f file.yaml`, meaning: `Remove what the file defines`, when: `Clean teardown` },
  { cat: "Delete", cmd: `kubectl delete pod web --grace-period=0 --force`, meaning: `Force-kill a stuck pod`, when: `Last resort` },
  { cat: "Delete", cmd: `kubectl delete pods -l app=web`, meaning: `Bulk delete by label`, when: `Cleanup` },
  { cat: "Debug", cmd: `kubectl logs <p>`, meaning: `Container stdout`, when: `See app errors` },
  { cat: "Debug", cmd: `kubectl logs <p> --previous`, meaning: `Last crashed container's logs`, when: `Crashloop forensics` },
  { cat: "Debug", cmd: `kubectl logs -f <p> -c <c>`, meaning: `Stream a specific container`, when: `Live multi-container debug` },
  { cat: "Debug", cmd: `kubectl exec -it <p> -- sh`, meaning: `Shell into a pod`, when: `Poke around inside` },
  { cat: "Debug", cmd: `kubectl debug -it <p> --image=busybox --target=<c>`, meaning: `Ephemeral debug container in a running pod`, when: `Distroless / no-shell images` },
  { cat: "Debug", cmd: `kubectl port-forward svc/web 8080:80`, meaning: `Tunnel to a service`, when: `Test locally` },
  { cat: "Debug", cmd: `kubectl top pod / kubectl top node`, meaning: `Live CPU/mem (needs metrics-server)`, when: `Spot resource hogs` },
  { cat: "Debug", cmd: `kubectl get endpoints <svc>`, meaning: `Pods actually behind a Service`, when: `"Why no traffic?"` },
  { cat: "Nodes & scheduling", cmd: `kubectl get nodes -o wide`, meaning: `Nodes + status + IPs`, when: `Health glance` },
  { cat: "Nodes & scheduling", cmd: `kubectl describe node <n>`, meaning: `Capacity, taints, conditions`, when: `Node debugging` },
  { cat: "Nodes & scheduling", cmd: `kubectl cordon <n>`, meaning: `Stop new pods on a node`, when: `Pre-maintenance` },
  { cat: "Nodes & scheduling", cmd: `kubectl drain <n> --ignore-daemonsets --delete-emptydir-data`, meaning: `Evacuate pods safely`, when: `Patch / upgrade` },
  { cat: "Nodes & scheduling", cmd: `kubectl uncordon <n>`, meaning: `Re-enable scheduling`, when: `Post-maintenance` },
  { cat: "Nodes & scheduling", cmd: `kubectl taint nodes <n> key=val:NoSchedule`, meaning: `Repel pods from a node`, when: `Reserve a node` },
  { cat: "Nodes & scheduling", cmd: `kubectl taint nodes <n> key:NoSchedule-`, meaning: `Remove the taint (trailing -)`, when: `Open node back up` },
  { cat: "DNS & CNI", cmd: `kubectl run net --image=busybox:1.36 --rm -it -- sh`, meaning: `Throwaway pod with nslookup/wget/nc`, when: `Start every network debug here` },
  { cat: "DNS & CNI", cmd: `nslookup kubernetes.default`, meaning: `(inside the pod) is cluster DNS alive at all?`, when: `First DNS sanity check` },
  { cat: "DNS & CNI", cmd: `kubectl exec <p> -- nslookup <svc>.<ns>.svc.cluster.local`, meaning: `Resolve a specific Service FQDN`, when: `"Can't reach service X by name"` },
  { cat: "DNS & CNI", cmd: `kubectl exec <p> -- cat /etc/resolv.conf`, meaning: `Pod nameserver + search + ndots`, when: `Slow / failing lookups` },
  { cat: "DNS & CNI", cmd: `kubectl -n kube-system get pods -l k8s-app=kube-dns -o wide`, meaning: `CoreDNS pods + which nodes`, when: `Check DNS is healthy/scaled` },
  { cat: "DNS & CNI", cmd: `kubectl -n kube-system logs -l k8s-app=kube-dns --tail=80`, meaning: `CoreDNS logs (SERVFAIL, upstream)`, when: `Resolution errors` },
  { cat: "DNS & CNI", cmd: `kubectl -n kube-system get pods -o wide | grep -Ei 'calico|cilium|flannel|weave'`, meaning: `CNI agent per node`, when: `Pods stuck ContainerCreating / no IP` },
  { cat: "DNS & CNI", cmd: `kubectl get endpointslices -l kubernetes.io/service-name=<svc>`, meaning: `Modern view of who's behind a Service`, when: `Endpoints look empty/wrong` },
  { cat: "DNS & CNI", cmd: `kubectl describe svc <svc>`, meaning: `Selector + endpoints + ports in one view`, when: `Service wiring sanity check` },
  { cat: "Cluster health", cmd: `kubectl -n kube-system get pods`, meaning: `Control-plane static pods (apiserver/etcd/scheduler/cm)`, when: `Control-plane health` },
  { cat: "Cluster health", cmd: `kubectl get --raw='/healthz?verbose'`, meaning: `apiserver self-health, check by check`, when: `Is the API server actually OK?` },
  { cat: "Cluster health", cmd: `kubectl get apiservices | grep -i false`, meaning: `Broken aggregated APIs (e.g. metrics-server)`, when: `'kubectl top' or webhooks failing` },
  { cat: "Cluster health", cmd: `kubectl get cs`, meaning: `componentstatuses (deprecated, still on exam)`, when: `Quick control-plane glance` },
  { cat: "Cluster health", cmd: `ETCDCTL_API=3 etcdctl endpoint health --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key`, meaning: `Is etcd healthy?`, when: `Control-plane sluggish / DR` },
  { cat: "Cluster health", cmd: `ETCDCTL_API=3 etcdctl member list -w table --endpoints=... --cacert=... --cert=... --key=...`, meaning: `etcd members + who's leader`, when: `Quorum / leader-flapping issues` },
  { cat: "Cluster health", cmd: `kubeadm certs check-expiration`, meaning: `Control-plane cert expiry dates`, when: `x509 errors / yearly cert rotation` },
  { cat: "Cluster health", cmd: `journalctl -u kubelet -f`, meaning: `Kubelet logs on the node itself`, when: `Node NotReady, kubectl is blind` },
  { cat: "Cluster health", cmd: `crictl ps -a   &&   crictl logs <id>`, meaning: `Runtime-level containers + logs`, when: `When the API/kubelet can't help` },
  { cat: "Cluster health", cmd: `kubectl top node`, meaning: `Live node CPU/mem pressure`, when: `Find the overloaded node` },
  { cat: "Config & context", cmd: `kubectl config get-contexts`, meaning: `List clusters/contexts`, when: `Multi-cluster` },
  { cat: "Config & context", cmd: `kubectl config use-context <c>`, meaning: `Switch cluster`, when: `Don't nuke prod by accident` },
  { cat: "Config & context", cmd: `kubectl config set-context --current --namespace=dev`, meaning: `Set default namespace`, when: `Stop typing -n` },
  { cat: "RBAC", cmd: `kubectl auth can-i create pods`, meaning: `Test your own permissions`, when: `Debug access` },
  { cat: "RBAC", cmd: `kubectl auth can-i list secrets --as=system:serviceaccount:dev:bot`, meaning: `Test as a ServiceAccount`, when: `Verify bindings` },
  { cat: "RBAC", cmd: `kubectl auth can-i --list --as=system:serviceaccount:dev:bot`, meaning: `Everything an identity can do`, when: `Audit an over-privileged SA` },
  { cat: "RBAC", cmd: `kubectl create role dev --verb=get,list --resource=pods`, meaning: `Quick imperative Role`, when: `Fast RBAC` },
  { cat: "RBAC", cmd: `kubectl create rolebinding b --role=dev --user=alice`, meaning: `Bind the role to a subject`, when: `Grant access` },
  { cat: "RBAC", cmd: `kubectl create sa ci-bot`, meaning: `Make a ServiceAccount`, when: `Pod identity` },
  { cat: "Exam speed", cmd: `alias k=kubectl`, meaning: `Shorter typing`, when: `Set this first thing` },
  { cat: "Exam speed", cmd: `export do='--dry-run=client -o yaml'`, meaning: `Reusable YAML-gen flag → k run x --image=nginx $do`, when: `Huge time saver` },
  { cat: "Exam speed", cmd: `export now='--grace-period=0 --force'`, meaning: `Reusable fast-delete flags`, when: `Save seconds` },
  { cat: "Exam speed", cmd: `kubectl get po -o jsonpath='{.items[*].metadata.name}'`, meaning: `Extract specific fields`, when: `Scripted answers` },
  { cat: "Exam speed", cmd: `kubectl explain pod.spec.containers`, meaning: `Drill one field path`, when: `Recall nesting offline` },
];

/* ---------------- yaml ---------------- */
const YAML = [
  { name: "Pod", category: "Workloads", note: `Smallest unit — usually you'd use a Deployment instead.`, mistake: `Forgetting labels — then a Service can't select it.`,
    yaml: `apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    app: web
spec:
  containers:
    - name: nginx
      image: nginx:1.27
      ports:
        - containerPort: 80` },
  { name: "Deployment", category: "Workloads", note: `Default for stateless apps — manages a ReplicaSet + rolling updates.`, mistake: `selector.matchLabels not matching template.labels → it won't deploy.`,
    yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:1.27
          ports:
            - containerPort: 80` },
  { name: "Service", category: "Networking", note: `Stable IP/DNS, load-balances to pods labeled app=web.`, mistake: `Mixing up port (service) vs targetPort (container), or selector not matching pods.`,
    yaml: `apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80
  type: ClusterIP` },
  { name: "ConfigMap", category: "Workloads", note: `Non-secret config as env vars or mounted files.`, mistake: `Treating it as secret — values are plain text.`,
    yaml: `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: "info"
  config.yaml: |
    feature: true` },
  { name: "Secret", category: "Security", note: `Use stringData for plaintext-in (auto base64-encoded).`, mistake: `Thinking base64 = encryption. It isn't.`,
    yaml: `apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
stringData:
  password: s3cr3t` },
  { name: "PVC", category: "Storage", note: `Requests durable storage; binds to a PV or dynamically provisions.`, mistake: `No matching PV / no storageClass → stuck Pending forever.`,
    yaml: `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard` },
  { name: "Job", category: "Workloads", note: `Runs to completion (batch / one-off tasks).`, mistake: `restartPolicy: Always is invalid for Jobs — use Never or OnFailure.`,
    yaml: `apiVersion: batch/v1
kind: Job
metadata:
  name: migrate
spec:
  completions: 1
  backoffLimit: 4
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: migrate:1.0
          command: ["sh","-c","echo done"]` },
  { name: "CronJob", category: "Workloads", note: `A Job on a cron schedule.`, mistake: `Wrong cron string, or forgetting it uses the controller timezone unless timeZone is set.`,
    yaml: `apiVersion: batch/v1
kind: CronJob
metadata:
  name: report
spec:
  schedule: "0 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: report
              image: report:1.0` },
  { name: "NetworkPolicy", category: "Networking", note: `Empty podSelector + Ingress = deny all inbound in this namespace.`, mistake: `No enforcement without a CNI that supports it (Calico/Cilium). flannel alone won't.`,
    yaml: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
spec:
  podSelector: {}
  policyTypes:
    - Ingress` },
  { name: "Role", category: "Security", note: `Namespaced permissions (here: read pods in dev).`, mistake: `Using a Role for cluster-scoped resources — those need a ClusterRole.`,
    yaml: `apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: dev
  name: pod-reader
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get","list","watch"]` },
  { name: "RoleBinding", category: "Security", note: `Grants a Role to a user / SA inside a namespace.`, mistake: `roleRef is immutable — wrong ref means delete & recreate.`,
    yaml: `apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: dev
subjects:
  - kind: User
    name: alice
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io` },
];

/* ---------------- traps ---------------- */
const TRAPS = [
  { title: "cordon vs drain vs uncordon", items: [
      { name: "cordon", desc: "Mark unschedulable — existing pods stay." },
      { name: "drain", desc: "Cordon + evict existing pods (respects PDBs)." },
      { name: "uncordon", desc: "Make the node schedulable again." }],
    key: `drain = cordon + evict. Cordon first, uncordon to restore.` },
  { title: "Deployment vs ReplicaSet", items: [
      { name: "ReplicaSet", desc: "Just keeps N identical pods alive." },
      { name: "Deployment", desc: "Manages ReplicaSets + rolling updates/rollbacks." }],
    key: `You almost never touch ReplicaSets directly — Deployment owns them.` },
  { title: "Service vs Ingress", items: [
      { name: "Service", desc: "L4 stable IP, load-balances to pods." },
      { name: "Ingress", desc: "L7 HTTP routing by host/path — needs a controller." }],
    key: `Service = the address; Ingress = a smart HTTP router on top.` },
  { title: "PV vs PVC", items: [
      { name: "PV", desc: "The actual storage resource (supply)." },
      { name: "PVC", desc: "A pod's request/claim for storage (demand)." }],
    key: `PVC binds to a PV. Pods mount PVCs, never PVs directly.` },
  { title: "requests vs limits", items: [
      { name: "requests", desc: "Guaranteed; used by the scheduler to place pods." },
      { name: "limits", desc: "Hard cap. Over memory → OOMKill, over CPU → throttle." }],
    key: `requests get you the table; limits are the spending cap.` },
  { title: "labels vs annotations", items: [
      { name: "labels", desc: "Identifying — you select by these." },
      { name: "annotations", desc: "Descriptive metadata — never selected on." }],
    key: `Select by labels; never by annotations.` },
  { title: "Role vs ClusterRole", items: [
      { name: "Role", desc: "Namespaced permissions." },
      { name: "ClusterRole", desc: "Cluster-wide / non-namespaced (nodes, PVs)." }],
    key: `Namespaced → Role. Cluster-scoped or cross-namespace → ClusterRole. A RoleBinding can reference a ClusterRole to scope it to one namespace.` },
  { title: "liveness vs readiness vs startup", items: [
      { name: "liveness", desc: "Fail → restart the container." },
      { name: "readiness", desc: "Fail → remove from Service endpoints (no restart)." },
      { name: "startup", desc: "Shields slow boots, then hands off to liveness." }],
    key: `Readiness pulls traffic; liveness reboots. Don't swap them.` },
  { title: "ClusterIP vs NodePort vs LoadBalancer", items: [
      { name: "ClusterIP", desc: "Internal-only stable IP." },
      { name: "NodePort", desc: "Opens a static port on every node." },
      { name: "LoadBalancer", desc: "Provisions a cloud LB (builds on NodePort)." }],
    key: `LoadBalancer ⊃ NodePort ⊃ ClusterIP.` },
  { title: "taint vs affinity", items: [
      { name: "taint", desc: "Repels pods from a node (needs a toleration)." },
      { name: "node affinity", desc: "Attracts pods to nodes by label." }],
    key: `Taint pushes away; affinity pulls toward. A toleration only PERMITS, it doesn't attract.` },
  { title: "ConfigMap vs Secret", items: [
      { name: "ConfigMap", desc: "Plain config (env vars / files)." },
      { name: "Secret", desc: "Sensitive data — base64, can encrypt at rest." }],
    key: `Same mechanics; Secret adds (weak-by-default) protection. base64 ≠ secure.` },
  { title: "NoSchedule vs NoExecute vs PreferNoSchedule", items: [
      { name: "NoSchedule", desc: "Blocks NEW pods without a toleration." },
      { name: "PreferNoSchedule", desc: "Best-effort avoid — soft." },
      { name: "NoExecute", desc: "Blocks new AND evicts already-running pods." }],
    key: `Only NoExecute evicts pods that are already running on the node.` },
  { title: "Retain vs Delete reclaim policy", items: [
      { name: "Retain", desc: "Keep the disk after PVC delete (manual cleanup)." },
      { name: "Delete", desc: "Destroy the backing disk when the PVC is deleted." }],
    key: `Dynamically-provisioned PVs often default to Delete — your data can vanish with the PVC.` },
  { title: "RWO vs ROX vs RWX", items: [
      { name: "ReadWriteOnce", desc: "Mounted read-write by one node at a time." },
      { name: "ReadOnlyMany", desc: "Read-only by many nodes." },
      { name: "ReadWriteMany", desc: "Read-write by many nodes (needs NFS/CephFS/EFS)." }],
    key: `Most cloud BLOCK storage is RWO only. RWX needs a shared filesystem backend.` },
  { title: "WaitForFirstConsumer vs Immediate", items: [
      { name: "Immediate", desc: "Provision the volume as soon as the PVC is created." },
      { name: "WaitForFirstConsumer", desc: "Provision after the pod is scheduled (right zone)." }],
    key: `Immediate can provision in the wrong zone → pod can't attach. WFFC avoids it.` },
  { title: "rollout undo scope", items: [
      { name: "Reverts", desc: "The pod template — image, args, env, resources." },
      { name: "Does NOT revert", desc: "External ConfigMaps / Secrets it references." }],
    key: `Undo rolls back the Deployment spec, not the config objects around it.` },
];

/* ---------------- quiz ---------------- */
const QUIZ = [
  { type: "concept", topic: "Workloads", q: "Deployment vs ReplicaSet — what's the difference?", a: "A ReplicaSet just maintains N pods. A Deployment manages ReplicaSets and adds rolling updates, rollbacks and revision history. You use Deployments; they create ReplicaSets under the hood." },
  { type: "troubleshoot", topic: "Scheduling", q: "A pod is stuck in Pending. First things to check?", a: "kubectl describe pod → events. Usually insufficient resources, no node matches nodeSelector/affinity, a taint with no toleration, or an unbound PVC (no matching PV / storageClass)." },
  { type: "troubleshoot", topic: "Workloads", q: "A pod is in CrashLoopBackOff. How do you find the cause?", a: "kubectl logs <pod> --previous for the crashed container, then describe for exit codes/events. Common: bad command, missing config/secret, failing liveness probe, or OOMKilled (exit 137)." },
  { type: "concept", topic: "Scheduling", q: "requests vs limits — what does each control?", a: "requests = resources the scheduler guarantees/reserves (drives placement). limits = hard ceiling. Exceed the memory limit → OOMKilled; exceed CPU → throttled." },
  { type: "scenario", topic: "Workloads", q: "You need a DB with stable network identity and its own disk per replica. Which controller?", a: "A StatefulSet — stable pod names (db-0, db-1), ordered rollout, and a sticky PVC per pod." },
  { type: "concept", topic: "Maintenance", q: "cordon vs drain?", a: "cordon marks a node unschedulable (existing pods stay). drain does that and also evicts existing pods (respecting PDBs). Drain before maintenance." },
  { type: "scenario", topic: "Workloads", q: "Run a log collector on every node, including new ones. What do you use?", a: "A DaemonSet — one pod per node, auto-scheduled onto any node you add." },
  { type: "concept", topic: "Networking", q: "Why does a Service exist if pods already have IPs?", a: "Pod IPs are ephemeral and change on restart/reschedule. A Service gives a stable virtual IP + DNS name and load-balances across matching pods (via kube-proxy iptables/IPVS rules)." },
  { type: "troubleshoot", topic: "Networking", q: "A Service returns no endpoints. Why?", a: "Its selector doesn't match any running/ready pods, or pods are failing readiness. Check kubectl get endpoints <svc> (or endpointslices) and the label match." },
  { type: "concept", topic: "Networking", q: "What does an Ingress need to actually work?", a: "An ingress controller (nginx, traefik, etc.) running in the cluster. The Ingress object alone is just routing rules — and a referenced TLS Secret must be in the same namespace." },
  { type: "interview", topic: "Security", q: "How do the RBAC pieces fit together?", a: "Role/ClusterRole define permissions; RoleBinding/ClusterRoleBinding attach them to a subject (user, group, or ServiceAccount). Role = namespaced, ClusterRole = cluster-wide. A RoleBinding can reference a ClusterRole to scope it to one namespace." },
  { type: "scenario", topic: "Security", q: "An app in a pod must call the Kubernetes API. How do you give it scoped access?", a: "Create a ServiceAccount, grant permissions via a (Cluster)RoleBinding, and set serviceAccountName on the pod. Disable automount where the API isn't needed." },
  { type: "concept", topic: "Storage", q: "PV vs PVC?", a: "PV is the actual storage resource (supply); PVC is a pod's request that binds to a PV (demand). Pods mount PVCs." },
  { type: "troubleshoot", topic: "Storage", q: "A PVC is stuck Pending. Likely reasons?", a: "No matching PV (size/accessMode), no or incorrect storageClass for dynamic provisioning, or the provisioner isn't running." },
  { type: "concept", topic: "Storage", q: "What does a StorageClass do?", a: "Enables dynamic provisioning — defines the provisioner, parameters, reclaim policy, and binding mode so PVs are created on demand for matching PVCs." },
  { type: "interview", topic: "Workloads", q: "liveness vs readiness probe — the practical difference?", a: "Liveness failing restarts the container; readiness failing removes the pod from Service endpoints (no restart). Readiness for warmup/dependencies, liveness for true deadlocks." },
  { type: "scenario", topic: "Scheduling", q: "You want replicas spread across nodes for HA. What do you configure?", a: "Pod anti-affinity (or topologySpreadConstraints) on the pod's own label across kubernetes.io/hostname." },
  { type: "concept", topic: "Scheduling", q: "Taint vs toleration — does a toleration place the pod?", a: "A taint repels pods from a node; a toleration lets a pod tolerate it. A toleration only permits scheduling — it doesn't attract. Use node affinity/nodeSelector to attract." },
  { type: "troubleshoot", topic: "Architecture", q: "kubectl get pods shows nothing, but you know pods exist. Why?", a: "Wrong namespace. Add -n <ns> or -A. Your context's default namespace may differ." },
  { type: "interview", topic: "Workloads", q: "How do you do a zero-downtime image update and roll back if it fails?", a: "kubectl set image deploy/web web=img:tag (rolling update), watch kubectl rollout status, and kubectl rollout undo deploy/web to revert the pod template." },
  { type: "concept", topic: "Security", q: "ConfigMap vs Secret — the real difference?", a: "Mechanically similar. Secrets are meant for sensitive data — base64-encoded and can be encrypted at rest + RBAC-restricted. base64 alone is not encryption." },
  { type: "scenario", topic: "Workloads", q: "Run a one-off DB migration that completes once and stops. Which object?", a: "A Job (restartPolicy: Never or OnFailure). For scheduled repeats, a CronJob." },
  { type: "troubleshoot", topic: "Architecture", q: "A node shows NotReady. Where do you look?", a: "kubectl describe node conditions, then the kubelet (journalctl -u kubelet) and container runtime (and CNI/network). Could be kubelet down, disk/memory pressure, or a network plugin issue." },
  { type: "interview", topic: "Maintenance", q: "How do you back up cluster state and why does it matter?", a: "Snapshot etcd (etcdctl snapshot save with certs/endpoints). etcd holds all cluster state — losing it loses the cluster. Restore creates a new data dir you must point the etcd manifest at." },
  { type: "concept", topic: "Architecture", q: "What is a namespace good for, and what isn't namespaced?", a: "Grouping/isolating resources, scoping names, quotas and RBAC. Cluster-scoped objects like nodes, PersistentVolumes and ClusterRoles are not namespaced." },
  { type: "scenario", topic: "Scheduling", q: "Pods won't schedule onto a tainted GPU node. Two things needed?", a: "A matching toleration (to be allowed) and usually node affinity/nodeSelector (to be attracted to those nodes)." },
  { type: "troubleshoot", topic: "Networking", q: "An app can't resolve another service by name. What do you check?", a: "CoreDNS pods/health and logs, the exact DNS name (svc.ns.svc.cluster.local), /etc/resolv.conf, and whether the target Service has endpoints. Test from a busybox debug pod with nslookup." },
  { type: "interview", topic: "Networking", q: "Difference between ClusterIP, NodePort and LoadBalancer?", a: "ClusterIP = internal-only stable IP. NodePort = opens a static port on every node. LoadBalancer = provisions an external cloud LB (builds on NodePort)." },
  { type: "concept", topic: "Workloads", q: "Why must a Deployment's selector match its pod template labels?", a: "The selector is how the Deployment/ReplicaSet adopts and manages its pods. A mismatch means it can't own them — and the selector is immutable after creation." },
  { type: "scenario", topic: "Maintenance", q: "You're upgrading a node's kernel. Safe sequence?", a: "cordon → drain --ignore-daemonsets --delete-emptydir-data → patch/reboot → uncordon. Respect PodDisruptionBudgets." },
  { type: "troubleshoot", topic: "Workloads", q: "A rollout is stuck: '2 of 3 updated replicas are available'. Why?", a: "The new pods are failing readiness — bad image, missing config/secret, or a probe that never passes. Inspect the NEW ReplicaSet's pods with describe + logs." },
  { type: "troubleshoot", topic: "Workloads", q: "A container exits with code 137. What happened?", a: "OOMKilled — it exceeded its memory limit (137 = 128 + SIGKILL/9). describe shows reason: OOMKilled. Raise the limit or fix the leak." },
  { type: "troubleshoot", topic: "Storage", q: "A PVC is bound, but the pod is stuck ContainerCreating during a failover with a Multi-Attach error. Cause?", a: "A ReadWriteOnce volume is still attached to the old (dead) node. Block storage can't mount on two nodes at once — force-detach or wait for the old attachment to release." },
  { type: "troubleshoot", topic: "Architecture", q: "kubectl suddenly fails everywhere with 'x509: certificate has expired'. Fix?", a: "Control-plane certs expired (common ~1 year after a kubeadm install). Run kubeadm certs renew all, then restart the control-plane static pods." },
  { type: "troubleshoot", topic: "Networking", q: "You wrote a NetworkPolicy but traffic still flows. Why?", a: "Your CNI doesn't enforce NetworkPolicy (e.g. plain flannel). You need a policy-capable CNI like Calico or Cilium." },
  { type: "troubleshoot", topic: "Architecture", q: "A deleted namespace is stuck in Terminating. What's holding it?", a: "A resource with a finalizer that isn't completing (often a broken CRD or admission webhook). Find the blocking resource and clear/patch its finalizer." },
  { type: "troubleshoot", topic: "Architecture", q: "'kubectl top' returns error: ServiceUnavailable. Why?", a: "metrics-server is down or its aggregated APIService is unavailable. Check kubectl get apiservices | grep -i false and the metrics-server pod." },
  { type: "interview", topic: "Maintenance", q: "etcd is 'up' but the apiserver is slow and leader elections flap. Prime suspect?", a: "etcd disk latency / IO contention. etcd is extremely fsync-sensitive — it needs fast, dedicated disks or the whole control plane degrades." },
  { type: "scenario", topic: "Workloads", q: "An env-var ConfigMap was edited but running pods didn't change. Why?", a: "Env vars are injected at container start — editing the ConfigMap does nothing until a rollout restart. Mounted-file ConfigMaps update in place (with a delay)." },
  { type: "interview", topic: "Security", q: "A CI ServiceAccount can suddenly delete prod resources. What went wrong?", a: "Over-broad RBAC — likely a ClusterRoleBinding to admin/cluster-admin. Scope it to least privilege; audit with kubectl auth can-i --list --as=<sa>." },
];

/* ---------------- cram ---------------- */
const CRAM = [
  { day: 1, focus: "Architecture & core objects", color: "#60a5fa",
    learn: ["Cluster, nodes, control plane vs worker", "Control-plane parts: API server, scheduler, controller-manager, etcd", "kubelet & kube-proxy roles", "How a request flows through the API server"],
    practice: ["kubectl get / describe nodes", "Create a pod and a deployment imperatively", "Inspect a pod with -o yaml"],
    memorize: ["One line per control-plane component", "What kubelet vs kube-proxy do"],
    troubleshoot: ["Read a NotReady node's conditions"] },
  { day: 2, focus: "Workloads", color: "#a78bfa",
    learn: ["Pod, ReplicaSet, Deployment", "DaemonSet, StatefulSet", "Job & CronJob", "Probes: liveness / readiness / startup"],
    practice: ["Rolling update + rollout undo", "Scale a deployment", "Create a Job and a CronJob", "Add a readiness probe"],
    memorize: ["Which controller for which use case", "liveness vs readiness vs startup"],
    troubleshoot: ["Diagnose CrashLoopBackOff with logs --previous"] },
  { day: 3, focus: "Scheduling", color: "#fbbf24",
    learn: ["requests vs limits & QoS classes", "Taints & tolerations (incl. NoExecute)", "Node / pod / anti-affinity", "nodeSelector & topologySpreadConstraints"],
    practice: ["Taint a node, then tolerate it", "Spread replicas with anti-affinity", "Set requests/limits on a pod"],
    memorize: ["requests vs limits", "taint repels vs affinity attracts"],
    troubleshoot: ["Fix a Pending pod (resources / affinity / taint)"] },
  { day: 4, focus: "Networking", color: "#22d3ee",
    learn: ["Service types: ClusterIP / NodePort / LoadBalancer", "Cluster DNS, FQDN & ndots", "Ingress + controller + TLS", "NetworkPolicy basics + CNI enforcement"],
    practice: ["Expose a deployment as a Service", "port-forward to test", "nslookup a service from a busybox pod", "Write a deny-all NetworkPolicy"],
    memorize: ["DNS format svc.ns.svc.cluster.local", "Service vs Ingress"],
    troubleshoot: ["Service with no endpoints / DNS resolution fail"] },
  { day: 5, focus: "Storage", color: "#34d399",
    learn: ["PV, PVC, binding", "StorageClass, dynamic provisioning & binding mode", "Access modes RWO / ROX / RWX", "Reclaim policies (Retain vs Delete)"],
    practice: ["Create a PVC and mount it", "Dynamic provisioning via a StorageClass"],
    memorize: ["PV vs PVC", "Access modes + reclaim policy"],
    troubleshoot: ["PVC stuck Pending / Multi-Attach error"] },
  { day: 6, focus: "Security & RBAC", color: "#fb7185",
    learn: ["Role / ClusterRole + bindings", "ServiceAccounts & automount", "Secrets & encryption at rest", "Contexts & namespaces"],
    practice: ["Create a role + rolebinding", "auth can-i checks (+ --as)", "Create and mount a Secret"],
    memorize: ["The 4 RBAC objects", "Role vs ClusterRole"],
    troubleshoot: ["Resolve a 'forbidden' error with auth can-i --as"] },
  { day: 7, focus: "Maintenance, troubleshooting & mock", color: "#38bdf8",
    learn: ["cordon / drain / uncordon", "etcd backup & restore + health", "Cluster upgrade flow (kubeadm) + cert renewal"],
    practice: ["Drain and uncordon a node", "etcd snapshot save & restore", "etcdctl endpoint health", "Run a full mock with Quiz Mode"],
    memorize: ["cordon vs drain", "etcdctl snapshot command + flags"],
    troubleshoot: ["End-to-end: describe → logs → events → exec → node/CNI"] },
];

/* ---------------- rapid revision ---------------- */
const REV_CMDS = [
  `k get po -A -o wide  — every pod + node/IP`,
  `k describe po <p>  — events first`,
  `k logs <p> --previous  — crashloop forensics`,
  `k run x --image=nginx $do  — instant YAML ($do=--dry-run=client -o yaml)`,
  `k set image deploy/web web=img:tag  — rolling update`,
  `k rollout undo deploy/web  — rollback`,
  `k scale deploy web --replicas=5  — scale`,
  `k drain n1 --ignore-daemonsets --delete-emptydir-data  — evacuate`,
  `k cordon / uncordon n1  — stop / resume scheduling`,
  `k get endpoints <svc>  — does the Service hit pods?`,
  `k exec <p> -- nslookup <svc>.<ns>.svc.cluster.local  — DNS check`,
  `k -n kube-system logs -l k8s-app=kube-dns  — CoreDNS logs`,
  `k auth can-i --list --as=system:serviceaccount:dev:bot  — audit RBAC`,
  `k config set-context --current --namespace=dev  — stop typing -n`,
  `k explain <res> --recursive  — field tree offline`,
  `k get apiservices | grep -i false  — broken aggregated APIs`,
  `kubeadm certs check-expiration  — cert expiry`,
  `ETCDCTL_API=3 etcdctl endpoint health …  — is etcd healthy?`,
];
const REV_DIFFS = [
  ["requests vs limits", "scheduled/guaranteed vs hard cap (mem→OOMKill 137, cpu→throttle)"],
  ["probes", "liveness restarts · readiness pulls traffic · startup shields slow boots"],
  ["cordon/drain/uncordon", "no new pods · cordon+evict · re-enable"],
  ["PV vs PVC", "the storage vs the claim — pods mount PVCs"],
  ["Role vs ClusterRole", "namespaced vs cluster-wide / non-namespaced"],
  ["Service vs Ingress", "stable L4 address vs L7 HTTP router (needs controller)"],
  ["Deployment vs ReplicaSet", "manages rollouts vs just keeps N alive"],
  ["labels vs annotations", "select by these vs metadata, never selected"],
  ["taint/affinity/toleration", "repels · attracts · only permits"],
  ["NoSchedule vs NoExecute", "block new vs block new + evict running"],
  ["ClusterIP/NodePort/LB", "internal · port-per-node · cloud LB (superset)"],
  ["StatefulSet vs Deployment", "stable name + sticky PVC vs interchangeable pods"],
  ["Retain vs Delete", "keep disk vs destroy disk on PVC delete"],
  ["RWO vs RWX", "one node vs many nodes (needs shared FS)"],
  ["WFFC vs Immediate", "bind after scheduling (right zone) vs bind now"],
  ["ConfigMap vs Secret", "plain config vs sensitive (base64 ≠ encrypted)"],
];
const REV_HOOKS = [
  "Service = stable front desk for pods",
  "Deployment = shift manager swapping staff gradually",
  "DaemonSet = a smoke detector in every room",
  "StatefulSet = assigned seats with name tags + lockers",
  "Cordon = stop seating new customers",
  "Drain = walk diners out, then close the section",
  "Taint = 'staff only' sign · Toleration = the keycard",
  "Affinity = 'seat me by the window / next to my friend'",
  "requests = a held reservation · limits = a spending cap",
  "ConfigMap = open sticky note · Secret = locked drawer",
  "PVC = the rental agreement for a storage unit",
  "etcd snapshot = a save-game for the whole cluster",
];
const REV_INTERVIEW = [
  "Pod Pending → describe it: resources, affinity/taints, or unbound PVC.",
  "CrashLoopBackOff → logs --previous; check config/secret, command, OOM (137), probes.",
  "ContainerCreating (no logs) → volume/secret/CNI issue, not an app bug.",
  "Zero-downtime deploy → rolling update; rollout undo to revert.",
  "Spread replicas for HA → pod anti-affinity / topologySpreadConstraints.",
  "Pod needs API access → ServiceAccount + scoped RBAC binding.",
  "Service has no endpoints → selector/label mismatch or failing readiness.",
  "Node maintenance → cordon, drain --ignore-daemonsets, patch, uncordon.",
  "x509 expired everywhere → renew control-plane certs (kubeadm).",
  "Lost cluster → restore etcd from snapshot + repoint the manifest.",
];
const REV_SEQ = [
  { t: "Node maintenance", s: `cordon → drain --ignore-daemonsets --delete-emptydir-data → patch/reboot → uncordon` },
  { t: "etcd backup", s: `ETCDCTL_API=3 etcdctl snapshot save snap.db --endpoints=… --cacert=… --cert=… --key=…` },
  { t: "etcd restore", s: `etcdctl snapshot restore snap.db --data-dir=/var/lib/etcd-new → point etcd manifest at it → restart` },
  { t: "Cert renewal", s: `kubeadm certs check-expiration → kubeadm certs renew all → restart control-plane pods` },
];

/* ---------------- storage (real localStorage, fault-tolerant) ---------------- */
const SK = "cka_progress_v2";
const MK = "cka_muted_v1";
const DEFAULT = { gap: {}, quiz: {}, cram: {} };
function loadProgress() {
  try {
    const raw = localStorage.getItem(SK);
    if (raw) { const p = JSON.parse(raw); return { gap: p.gap || {}, quiz: p.quiz || {}, cram: p.cram || {} }; }
  } catch (e) { /* sandbox / private mode — fall back to memory */ }
  return DEFAULT;
}
function saveProgress(p) { try { localStorage.setItem(SK, JSON.stringify(p)); } catch (e) {} }
function loadMuted() { try { return localStorage.getItem(MK) === "1"; } catch (e) { return false; } }
function saveMuted(m) { try { localStorage.setItem(MK, m ? "1" : "0"); } catch (e) {} }

/* ---------------- feedback engine (Web Audio + vibration) ---------------- */
function useFx(muted) {
  const ctxRef = useRef(null);
  const mref = useRef(muted);
  useEffect(() => { mref.current = muted; }, [muted]);
  const ctx = () => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!ctxRef.current) ctxRef.current = new AC();
      if (ctxRef.current.state === "suspended") ctxRef.current.resume();
      return ctxRef.current;
    } catch (e) { return null; }
  };
  const buzz = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };
  const tone = (c, o) => {
    const f = o.f, t = o.t || 0, d = o.d || 0.12, v = o.v || 0.14, type = o.type || "sine", to = o.to;
    const s = c.currentTime + t, osc = c.createOscillator(), g = c.createGain();
    osc.type = type; osc.frequency.setValueAtTime(f, s);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, s + d);
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(v, s + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, s + d);
    osc.connect(g); g.connect(c.destination); osc.start(s); osc.stop(s + d + 0.03);
  };
  return (kind) => {
    if (kind === "tap") buzz(15);
    else if (kind === "open") buzz(12);
    else if (kind === "success") buzz([12, 30, 12]);
    else if (kind === "correct") buzz([10, 30, 14]);
    else if (kind === "wrong") buzz([0, 45, 35, 45]);
    if (mref.current) return;
    const c = ctx(); if (!c) return;
    if (kind === "tap") tone(c, { f: 520, d: 0.05, v: 0.07, type: "triangle" });
    else if (kind === "open") tone(c, { f: 380, d: 0.06, v: 0.07, type: "triangle" });
    else if (kind === "success") { tone(c, { f: 988, d: 0.08, v: 0.12, type: "square" }); tone(c, { f: 1319, t: 0.08, d: 0.16, v: 0.12, type: "square" }); }
    else if (kind === "correct") { tone(c, { f: 523, d: 0.12, v: 0.12 }); tone(c, { f: 659, t: 0.1, d: 0.12, v: 0.12 }); tone(c, { f: 784, t: 0.2, d: 0.18, v: 0.13 }); }
    else if (kind === "wrong") { tone(c, { f: 220, d: 0.18, v: 0.13, type: "sawtooth", to: 120 }); tone(c, { f: 160, t: 0.04, d: 0.2, v: 0.1, type: "sawtooth", to: 90 }); }
  };
}

/* ---------------- shared UI ---------------- */
function Collapse({ open, children }) {
  return (
    <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows .3s cubic-bezier(.4,0,.2,1)" }}>
      <div style={{ overflow: "hidden", minHeight: 0 }}>{children}</div>
    </div>
  );
}
function Ring({ pct, size = 44, stroke = 4, color = "#34d399", children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c - (pct / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={C.border} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 4px ${color}66)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}
function Bar({ pct, color }) {
  return <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
    <div className="h-full rounded-full" style={{ width: pct + "%", background: `linear-gradient(90deg,${color}cc,${color})`, transition: "width .6s cubic-bezier(.4,0,.2,1)", boxShadow: `0 0 8px ${color}66` }} /></div>;
}
function Chip({ active, label, icon: Icon, color, onClick }) {
  return <button onClick={onClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium transition-all active:scale-95 shrink-0"
    style={active ? { background: color || "#fff", color: "#07080b", border: "1px solid transparent", boxShadow: `0 4px 14px -4px ${(color || "#ffffff")}aa` } : { background: C.surface, color: C.textDim, border: `1px solid ${C.border}` }}>
    {Icon && <Icon size={13} />}{label}</button>;
}
function LevelBadge({ level }) {
  const l = LEVELS[level];
  return <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: l.c + "1f", color: l.c, border: `1px solid ${l.c}33` }}>{l.label}</span>;
}
function Lbl({ children }) { return <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.textFaint }}>{children}</div>; }
function Field({ label, children }) { return <div><Lbl>{label}</Lbl><div className="text-xs mt-1 leading-relaxed" style={{ color: C.text }}>{children}</div></div>; }
function Code({ children }) { return <pre className="rounded-lg px-3 py-2 text-xs font-mono overflow-x-auto leading-relaxed" style={{ background: "#0a0c11", border: `1px solid ${C.border}`, color: C.code }}>{children}</pre>; }
function Callout({ icon: Icon, color, title, children }) {
  return <div className="rounded-lg px-3 py-2.5 flex gap-2" style={{ background: color + "14", border: `1px solid ${color}33` }}>
    <Icon size={15} color={color} className="shrink-0" style={{ marginTop: 2 }} />
    <div className="text-xs leading-relaxed"><span className="font-semibold" style={{ color }}>{title} · </span><span style={{ color: C.text }}>{children}</span></div></div>;
}
function CopyBtn({ text, id, copied, onCopy }) {
  const isC = copied === id;
  return <button onClick={() => onCopy(text, id)} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs shrink-0 transition-all active:scale-90"
    style={{ background: C.surface2, color: isC ? "#34d399" : C.textDim, border: `1px solid ${isC ? "#34d39955" : C.border}` }}>
    {isC ? <Check size={12} /> : <Copy size={12} />}{isC ? "Copied" : "Copy"}</button>;
}
function StatusBtn({ active, color, label, onClick }) {
  return <button onClick={onClick} className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
    style={active ? { background: color, color: "#07080b", border: "1px solid transparent", boxShadow: `0 4px 12px -4px ${color}aa` } : { background: C.surface2, color: C.textDim, border: `1px solid ${C.border}` }}>{label}</button>;
}
function Stat({ value, label, color }) {
  return <div className="rounded-xl px-2 py-2.5 text-center relative overflow-hidden" style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color || C.textDim, opacity: 0.7 }} />
    <div className="text-base font-bold" style={{ color: color || C.text }}>{value}</div>
    <div className="text-xs mt-0.5" style={{ color: C.textFaint }}>{label}</div></div>;
}
function Footer() { return <div className="text-center text-xs pt-2 pb-2" style={{ color: C.textFaint }}>Progress is saved on this device · built for a fast refresh</div>; }
const micro = (p) => p >= 100 ? "Cluster-certified energy" : p >= 80 ? "Looking exam-ready" : p >= 60 ? "Halfway sharp" : p >= 40 ? "Building momentum" : p >= 20 ? "Warming up" : "Cold start";
const BLOCKS = [
  { k: "learn", label: "Learn", c: "#60a5fa" },
  { k: "practice", label: "Practice", c: "#34d399" },
  { k: "memorize", label: "Memorize", c: "#fbbf24" },
  { k: "troubleshoot", label: "Troubleshoot", c: "#fb7185" },
];

/* ---------------- app ---------------- */
export default function App() {
  const [tab, setTab] = useState("dash");
  const [crashCat, setCrashCat] = useState("All");
  const [crashLevel, setCrashLevel] = useState("All");
  const [cmdSearch, setCmdSearch] = useState("");
  const [cmdCat, setCmdCat] = useState("All");
  const [open, setOpen] = useState({});
  const [copied, setCopied] = useState(null);
  const [progress, setProgress] = useState(() => loadProgress());
  const [muted, setMuted] = useState(() => loadMuted());
  const fx = useFx(muted);

  useEffect(() => { saveProgress(progress); }, [progress]);
  useEffect(() => { saveMuted(muted); }, [muted]);
  useEffect(() => { try { window.scrollTo(0, 0); } catch (e) {} }, [tab]);

  const go = (id) => { fx("tap"); setTab(id); };
  const tog = (id) => { fx("open"); setOpen((o) => ({ ...o, [id]: !o[id] })); };
  const copy = (text, id) => {
    const done = () => { setCopied(id); setTimeout(() => setCopied((c) => (c === id ? null : c)), 1300); };
    const fb = () => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy");
        document.body.removeChild(ta); done();
      } catch (_) { done(); }
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fb);
      else fb();
    } catch (e) { fb(); }
  };
  const setGap = (k, v) => { fx(v === "know" ? "success" : "tap"); setProgress((p) => { const g = { ...p.gap }; if (g[k] === v) delete g[k]; else g[k] = v; return { ...p, gap: g }; }); };
  const reveal = (i) => { fx("tap"); setProgress((p) => ({ ...p, quiz: { ...p.quiz, [i]: { ...(p.quiz[i] || {}), revealed: true } } })); };
  const markQ = (i, mark) => {
    const cur = (progress.quiz[i] || {}).mark;
    const next = cur === mark ? null : mark;
    if (next === "got") fx("correct"); else if (next === "missed") fx("wrong"); else fx("tap");
    setProgress((p) => ({ ...p, quiz: { ...p.quiz, [i]: { ...(p.quiz[i] || {}), mark: next } } }));
  };
  const togCram = (id) => { const on = !progress.cram[id]; fx(on ? "success" : "tap"); setProgress((p) => { const c = { ...p.cram }; if (c[id]) delete c[id]; else c[id] = true; return { ...p, cram: c }; }); };
  const resetQuiz = () => { fx("tap"); setProgress((p) => ({ ...p, quiz: {} })); };
  const clearGap = () => { fx("tap"); setProgress((p) => ({ ...p, gap: {} })); };

  const known = CONCEPTS.filter((c) => progress.gap[c.key] === "know").length;
  const weak = CONCEPTS.filter((c) => progress.gap[c.key] === "weak").length;
  const revise = CONCEPTS.filter((c) => progress.gap[c.key] === "revise").length;
  const masteryPct = Math.round((known / CONCEPTS.length) * 100);
  const qMarks = Object.values(progress.quiz);
  const qReviewed = qMarks.filter((m) => m.mark).length;
  const qCorrect = qMarks.filter((m) => m.mark === "got").length;
  const cramTasks = [];
  CRAM.forEach((d, di) => BLOCKS.forEach((b) => (d[b.k] || []).forEach((_, ii) => cramTasks.push(`cr-${di}-${b.k}-${ii}`))));
  const cramDone = cramTasks.filter((id) => progress.cram[id]).length;
  const cramPct = cramTasks.length ? Math.round((cramDone / cramTasks.length) * 100) : 0;

  /* ---- Dashboard ---- */
  const Dashboard = () => (
    <div className="space-y-5">
      <div className="rounded-2xl p-5" style={{ background: "linear-gradient(150deg,#1a1d27,#0c0e13)", border: `1px solid ${C.border}`, boxShadow: "0 0 0 1px #ffffff06, 0 12px 48px -16px #34d39944" }}>
        <div className="flex items-center gap-4">
          <Ring pct={masteryPct} size={72} stroke={6} color="#34d399"><span className="text-base font-bold">{masteryPct}%</span></Ring>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-wide flex items-center gap-1" style={{ color: C.textFaint }}><Sparkles size={11} /> Mastery</div>
            <div className="text-lg font-semibold" style={{ color: C.text }}>{micro(masteryPct)}</div>
            <div className="text-xs mt-0.5" style={{ color: C.textDim }}>{known} of {CONCEPTS.length} concepts marked “Know”</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Stat value={`${qCorrect}/${QUIZ.length}`} label="Quiz correct" color="#60a5fa" />
          <Stat value={weak} label="Need work" color="#fbbf24" />
          <Stat value={`${cramPct}%`} label="Cram plan" color="#34d399" />
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: C.textDim }}>
        {Object.entries(LEVELS).map(([k, l]) => (
          <span key={k} className="flex items-center gap-1.5"><span className="inline-block rounded-full" style={{ width: 8, height: 8, background: l.c, boxShadow: `0 0 6px ${l.c}` }} />{l.label}</span>
        ))}
      </div>
      <div>
        <div className="mb-2">
          <div className="text-sm font-semibold" style={{ color: C.text }}>Domains</div>
          <div className="text-xs" style={{ color: C.textFaint }}>Tap a domain to jump into the crash course</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => {
            const acc = CAT[cat]; const Icon = acc.icon;
            const list = CONCEPTS.filter((c) => c.category === cat);
            const kn = list.filter((c) => progress.gap[c.key] === "know").length;
            const pct = Math.round((kn / list.length) * 100);
            const cnt = (lv) => list.filter((c) => c.level === lv).length;
            return (
              <button key={cat} onClick={() => { fx("tap"); setCrashCat(cat); setCrashLevel("All"); setTab("crash"); }}
                className="text-left rounded-2xl p-3.5 transition-all active:scale-[0.98]" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: acc.c + "22", boxShadow: `0 0 12px -2px ${acc.c}55` }}><Icon size={16} color={acc.c} /></span>
                  <span className="text-xs font-medium" style={{ color: C.textFaint }}>{kn}/{list.length}</span>
                </div>
                <div className="mt-2.5 text-sm font-semibold" style={{ color: C.text }}>{cat}</div>
                <div className="mt-1 text-xs" style={{ color: C.textDim }}>{cnt("must")} must · {cnt("good")} good · {cnt("advanced")} adv</div>
                <div className="mt-2.5"><Bar pct={pct} color={acc.c} /></div>
              </button>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );

  /* ---- Crash ---- */
  const Crash = () => {
    const filtered = CONCEPTS.filter((c) => (crashCat === "All" || c.category === crashCat) && (crashLevel === "All" || c.level === crashLevel));
    return (
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1 nsb">
          <Chip active={crashCat === "All"} label="All" onClick={() => { fx("tap"); setCrashCat("All"); }} />
          {CATEGORIES.map((cat) => <Chip key={cat} active={crashCat === cat} label={cat} color={CAT[cat].c} icon={CAT[cat].icon} onClick={() => { fx("tap"); setCrashCat(cat); }} />)}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 nsb">
          <Chip active={crashLevel === "All"} label="All levels" onClick={() => { fx("tap"); setCrashLevel("All"); }} />
          {Object.entries(LEVELS).map(([k, l]) => <Chip key={k} active={crashLevel === k} label={l.label} color={l.c} onClick={() => { fx("tap"); setCrashLevel(k); }} />)}
        </div>
        <div className="text-xs" style={{ color: C.textFaint }}>{filtered.length} concepts</div>
        <div className="space-y-2.5">
          {filtered.map((c) => {
            const id = "cr-" + c.key; const o = open[id];
            const st = progress.gap[c.key]; const sc = st ? STATUS[st] : null;
            return (
              <div key={c.key} className="rounded-2xl overflow-hidden transition-all" style={{ background: C.surface, border: `1px solid ${o ? CAT[c.category].c + "55" : C.border}`, borderLeft: `3px solid ${sc ? sc.c : CAT[c.category].c}` }}>
                <button onClick={() => tog(id)} className="w-full text-left px-4 py-3 flex items-center gap-3">
                  <span className="inline-block rounded-full shrink-0" style={{ width: 8, height: 8, background: CAT[c.category].c, boxShadow: `0 0 6px ${CAT[c.category].c}` }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap"><span className="text-sm font-semibold" style={{ color: C.text }}>{c.name}</span><LevelBadge level={c.level} /></div>
                    {!o && <div className="text-xs mt-0.5 truncate" style={{ color: C.textDim }}>{c.what}</div>}
                  </div>
                  <ChevronDown size={16} color={C.textFaint} style={{ transform: o ? "rotate(180deg)" : "none", transition: "transform .3s" }} />
                </button>
                <Collapse open={!!o}>
                  <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${C.borderSoft}`, paddingTop: 12 }}>
                    <Field label="What it is">{c.what}</Field>
                    <Field label="Why it exists">{c.why}</Field>
                    <Field label="When to use">{c.when}</Field>
                    <div><Lbl>Example</Lbl><div className="mt-1"><Code>{c.example}</Code></div></div>
                    <Callout icon={Lightbulb} color="#fbbf24" title="Memory hook">{c.analogy}</Callout>
                    <Callout icon={Activity} color="#fb7185" title="Production reality">{c.productionExample}</Callout>
                    <Callout icon={Brain} color="#a78bfa" title="Interview trap">{c.interviewTrap}</Callout>
                    <div><Lbl>How solid are you?</Lbl>
                      <div className="flex gap-2 mt-1.5">{["know", "weak", "revise"].map((v) => <StatusBtn key={v} active={st === v} color={STATUS[v].c} label={STATUS[v].label} onClick={() => setGap(c.key, v)} />)}</div>
                    </div>
                  </div>
                </Collapse>
              </div>
            );
          })}
        </div>
        <Footer />
      </div>
    );
  };

  /* ---- Command Lab ---- */
  const CmdLab = () => {
    const q = cmdSearch.trim().toLowerCase();
    const match = (c) => !q || c.cmd.toLowerCase().includes(q) || c.meaning.toLowerCase().includes(q) || c.when.toLowerCase().includes(q);
    const cats = cmdCat === "All" ? CMD_CATS : [cmdCat];
    const total = COMMANDS.filter(match).length;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <Search size={15} color={C.textFaint} />
          <input value={cmdSearch} onChange={(e) => setCmdSearch(e.target.value)} placeholder="Search commands…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: C.text }} />
          {cmdSearch && <button onClick={() => setCmdSearch("")} className="text-xs" style={{ color: C.textFaint }}>clear</button>}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 nsb">
          <Chip active={cmdCat === "All"} label="All" onClick={() => { fx("tap"); setCmdCat("All"); }} />
          {CMD_CATS.map((cat) => <Chip key={cat} active={cmdCat === cat} label={cat} color={CMD_CAT_COLOR[cat]} onClick={() => { fx("tap"); setCmdCat(cat); }} />)}
        </div>
        <div className="space-y-4">
          {cats.map((cat) => {
            const items = COMMANDS.filter((c) => c.cat === cat && match(c));
            if (!items.length) return null;
            const col = CMD_CAT_COLOR[cat];
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2"><span className="inline-block rounded-full" style={{ width: 8, height: 8, background: col, boxShadow: `0 0 6px ${col}` }} /><span className="text-sm font-semibold" style={{ color: C.text }}>{cat}</span><span className="text-xs" style={{ color: C.textFaint }}>{items.length}</span></div>
                <div className="space-y-2">
                  {items.map((c, i) => {
                    const id = cat + i;
                    return (
                      <div key={i} className="rounded-xl px-3.5 py-3 transition-all" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                        <div className="flex items-start justify-between gap-2"><code className="text-xs font-mono break-words flex-1" style={{ color: col }}>{c.cmd}</code><CopyBtn text={c.cmd} id={id} copied={copied} onCopy={copy} /></div>
                        <div className="text-xs mt-1.5" style={{ color: C.text }}>{c.meaning}</div>
                        <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: C.textFaint }}><ArrowRight size={11} />{c.when}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {total === 0 && <div className="text-sm text-center py-6" style={{ color: C.textFaint }}>No commands match “{cmdSearch}”.</div>}
        </div>
        <Footer />
      </div>
    );
  };

  /* ---- YAML ---- */
  const YamlLib = () => (
    <div className="space-y-2.5">
      {YAML.map((t, i) => {
        const id = "y-" + i; const o = open[id]; const acc = CAT[t.category];
        return (
          <div key={i} className="rounded-2xl overflow-hidden transition-all" style={{ background: C.surface, border: `1px solid ${o ? acc.c + "55" : C.border}` }}>
            <button onClick={() => tog(id)} className="w-full px-4 py-3 flex items-center gap-3 text-left">
              <FileCode size={15} color={acc.c} className="shrink-0" />
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold" style={{ color: C.text }}>{t.name}</div><div className="text-xs mt-0.5" style={{ color: C.textDim }}>{t.note}</div></div>
              <ChevronDown size={16} color={C.textFaint} style={{ transform: o ? "rotate(180deg)" : "none", transition: "transform .3s" }} />
            </button>
            <Collapse open={!!o}>
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${C.borderSoft}`, paddingTop: 12 }}>
                <div className="flex justify-end"><CopyBtn text={t.yaml} id={id} copied={copied} onCopy={copy} /></div>
                <Code>{t.yaml}</Code>
                <Callout icon={AlertTriangle} color="#fb7185" title="Common mistake">{t.mistake}</Callout>
              </div>
            </Collapse>
          </div>
        );
      })}
      <Footer />
    </div>
  );

  /* ---- Traps ---- */
  const Traps = () => (
    <div className="space-y-2.5">
      {TRAPS.map((t, i) => {
        const id = "t-" + i; const o = open[id];
        return (
          <div key={i} className="rounded-2xl overflow-hidden transition-all" style={{ background: C.surface, border: `1px solid ${o ? "#fbbf2455" : C.border}` }}>
            <button onClick={() => tog(id)} className="w-full px-4 py-3 flex items-center gap-3 text-left">
              <AlertTriangle size={15} color="#fbbf24" className="shrink-0" />
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold" style={{ color: C.text }}>{t.title}</div>{!o && <div className="text-xs mt-0.5" style={{ color: C.textFaint }}>tap to compare</div>}</div>
              <ChevronDown size={16} color={C.textFaint} style={{ transform: o ? "rotate(180deg)" : "none", transition: "transform .3s" }} />
            </button>
            <Collapse open={!!o}>
              <div className="px-4 pb-4 space-y-2" style={{ borderTop: `1px solid ${C.borderSoft}`, paddingTop: 12 }}>
                {t.items.map((it, j) => (
                  <div key={j} className="rounded-lg px-3 py-2" style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
                    <span className="text-xs font-semibold" style={{ color: C.text }}>{it.name}</span>
                    <div className="text-xs mt-0.5" style={{ color: C.textDim }}>{it.desc}</div>
                  </div>
                ))}
                <Callout icon={Target} color="#60a5fa" title="The catch">{t.key}</Callout>
              </div>
            </Collapse>
          </div>
        );
      })}
      <Footer />
    </div>
  );

  /* ---- Quiz ---- */
  const Quiz = () => (
    <div className="space-y-3">
      <div className="rounded-2xl p-4" style={{ background: "linear-gradient(150deg,#1a1d27,#0c0e13)", border: `1px solid ${C.border}`, boxShadow: "0 0 0 1px #ffffff06, 0 12px 48px -16px #a78bfa44" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold" style={{ color: C.text }}>{qReviewed}/{QUIZ.length} reviewed · {qCorrect} correct</div>
          <button onClick={resetQuiz} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all active:scale-90" style={{ background: C.surface2, color: C.textDim, border: `1px solid ${C.border}` }}><RotateCcw size={12} />Reset</button>
        </div>
        <Bar pct={Math.round((qReviewed / QUIZ.length) * 100)} color="#a78bfa" />
      </div>
      {QUIZ.map((q, i) => {
        const s = progress.quiz[i] || {}; const tc = QTYPES[q.type];
        const bord = s.mark === "got" ? "#34d39966" : s.mark === "missed" ? "#fb718566" : C.border;
        return (
          <div key={i} className="rounded-2xl p-4 transition-all" style={{ background: C.surface, border: `1px solid ${bord}` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: tc.c + "1f", color: tc.c, border: `1px solid ${tc.c}33` }}>{tc.label}</span>
              <span className="text-xs" style={{ color: C.textFaint }}>{q.topic}</span>
              <span className="ml-auto text-xs" style={{ color: C.textFaint }}>{i + 1}/{QUIZ.length}</span>
            </div>
            <div className="text-sm font-medium leading-snug" style={{ color: C.text }}>{q.q}</div>
            {!s.revealed ? (
              <button onClick={() => reveal(i)} className="mt-3 w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95" style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}` }}><Eye size={14} />Reveal answer</button>
            ) : (
              <>
                <div className="mt-3 rounded-lg px-3 py-2.5 text-xs leading-relaxed" style={{ background: "#0a0c11", border: `1px solid ${C.border}`, color: C.code }}>{q.a}</div>
                <div className="flex gap-2 mt-2.5">
                  <StatusBtn active={s.mark === "got"} color="#34d399" label="Got it" onClick={() => markQ(i, "got")} />
                  <StatusBtn active={s.mark === "missed"} color="#fb7185" label="Missed it" onClick={() => markQ(i, "missed")} />
                </div>
              </>
            )}
          </div>
        );
      })}
      <Footer />
    </div>
  );

  /* ---- Gap ---- */
  const GapCheck = () => (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: "linear-gradient(150deg,#1a1d27,#0c0e13)", border: `1px solid ${C.border}`, boxShadow: "0 0 0 1px #ffffff06, 0 12px 48px -16px #34d39944" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold" style={{ color: C.text }}>Self-assessment</div>
          <button onClick={clearGap} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all active:scale-90" style={{ background: C.surface2, color: C.textDim, border: `1px solid ${C.border}` }}><Trash2 size={12} />Clear</button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Stat value={known} label="Know" color="#34d399" />
          <Stat value={weak} label="Weak" color="#fbbf24" />
          <Stat value={revise} label="Later" color="#60a5fa" />
          <Stat value={CONCEPTS.length - known - weak - revise} label="Untouched" color={C.textDim} />
        </div>
        <div className="mt-3"><Bar pct={masteryPct} color="#34d399" /></div>
      </div>
      {CATEGORIES.map((cat) => {
        const list = CONCEPTS.filter((c) => c.category === cat);
        const kn = list.filter((c) => progress.gap[c.key] === "know").length;
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2"><span className="inline-block rounded-full" style={{ width: 8, height: 8, background: CAT[cat].c, boxShadow: `0 0 6px ${CAT[cat].c}` }} /><span className="text-sm font-semibold" style={{ color: C.text }}>{cat}</span><span className="ml-auto text-xs" style={{ color: C.textFaint }}>{kn}/{list.length}</span></div>
            <div className="space-y-2">
              {list.map((c) => {
                const st = progress.gap[c.key];
                return (
                  <div key={c.key} className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex-1 min-w-0 text-sm truncate" style={{ color: C.text }}>{c.name}</div>
                    <div className="flex gap-1.5 shrink-0">
                      {["know", "weak", "revise"].map((v) => (
                        <button key={v} onClick={() => setGap(c.key, v)} className="px-2 py-1 rounded-md text-xs font-medium transition-all active:scale-90"
                          style={st === v ? { background: STATUS[v].c, color: "#07080b", border: "1px solid transparent" } : { background: C.surface2, color: C.textFaint, border: `1px solid ${C.border}` }}>{STATUS[v].label}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <Footer />
    </div>
  );

  /* ---- Cram ---- */
  const Cram = () => (
    <div className="space-y-3">
      <div className="rounded-2xl p-4" style={{ background: "linear-gradient(150deg,#1a1d27,#0c0e13)", border: `1px solid ${C.border}`, boxShadow: "0 0 0 1px #ffffff06, 0 12px 48px -16px #38bdf844" }}>
        <div className="flex items-center gap-4">
          <Ring pct={cramPct} size={56} stroke={5} color="#38bdf8"><span className="text-sm font-bold">{cramPct}%</span></Ring>
          <div className="flex-1"><div className="text-sm font-semibold" style={{ color: C.text }}>7-Day Cram Plan</div><div className="text-xs mt-0.5" style={{ color: C.textDim }}>{cramDone}/{cramTasks.length} tasks done · check them off as you go</div></div>
        </div>
      </div>
      {CRAM.map((d, di) => {
        const id = "cram-" + di; const o = open[id] === undefined ? di === 0 : open[id];
        const dayTasks = [];
        BLOCKS.forEach((b) => (d[b.k] || []).forEach((_, ii) => dayTasks.push(`cr-${di}-${b.k}-${ii}`)));
        const dd = dayTasks.filter((x) => progress.cram[x]).length;
        const dp = Math.round((dd / dayTasks.length) * 100);
        return (
          <div key={di} className="rounded-2xl overflow-hidden transition-all" style={{ background: C.surface, border: `1px solid ${o ? d.color + "55" : C.border}`, borderLeft: `3px solid ${d.color}` }}>
            <button onClick={() => { fx("open"); setOpen((s) => ({ ...s, [id]: !(s[id] === undefined ? di === 0 : s[id]) })); }} className="w-full px-4 py-3 flex items-center gap-3 text-left">
              <Ring pct={dp} size={34} stroke={3.5} color={d.color}><span className="text-xs font-bold" style={{ color: C.text }}>{d.day}</span></Ring>
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold" style={{ color: C.text }}>Day {d.day} · {d.focus}</div><div className="text-xs mt-0.5" style={{ color: C.textFaint }}>{dd}/{dayTasks.length} done</div></div>
              <ChevronDown size={16} color={C.textFaint} style={{ transform: o ? "rotate(180deg)" : "none", transition: "transform .3s" }} />
            </button>
            <Collapse open={!!o}>
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${C.borderSoft}`, paddingTop: 12 }}>
                {BLOCKS.map((b) => (
                  <div key={b.k}>
                    <div className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: b.c }}>{b.label}</div>
                    <div className="space-y-1">
                      {(d[b.k] || []).map((it, ii) => {
                        const tid = `cr-${di}-${b.k}-${ii}`; const done = !!progress.cram[tid];
                        return (
                          <button key={ii} onClick={() => togCram(tid)} className="w-full flex items-start gap-2.5 text-left py-1 transition-all active:scale-[0.99]">
                            <span className="flex items-center justify-center rounded-md shrink-0 transition-all" style={{ width: 18, height: 18, marginTop: 1, background: done ? b.c : "transparent", border: `1.5px solid ${done ? b.c : C.border}`, boxShadow: done ? `0 0 8px ${b.c}66` : "none" }}>{done && <Check size={12} color="#07080b" />}</span>
                            <span className="text-xs leading-relaxed" style={{ color: done ? C.textFaint : C.text, textDecoration: done ? "line-through" : "none" }}>{it}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Collapse>
          </div>
        );
      })}
      <Footer />
    </div>
  );

  /* ---- Rapid ---- */
  const Rapid = () => {
    const G = ({ id, title, icon: Icon, color, children }) => {
      const o = open[id] === undefined ? true : open[id];
      return (
        <div className="rounded-2xl overflow-hidden transition-all" style={{ background: C.surface, border: `1px solid ${o ? color + "44" : C.border}` }}>
          <button onClick={() => { fx("open"); setOpen((s) => ({ ...s, [id]: !(s[id] === undefined ? true : s[id]) })); }} className="w-full px-4 py-3 flex items-center gap-2.5 text-left">
            <Icon size={15} color={color} className="shrink-0" />
            <div className="flex-1 text-sm font-semibold" style={{ color: C.text }}>{title}</div>
            <ChevronDown size={16} color={C.textFaint} style={{ transform: o ? "rotate(180deg)" : "none", transition: "transform .3s" }} />
          </button>
          <Collapse open={!!o}><div className="px-4 pb-4" style={{ borderTop: `1px solid ${C.borderSoft}`, paddingTop: 12 }}>{children}</div></Collapse>
        </div>
      );
    };
    return (
      <div className="space-y-2.5">
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "linear-gradient(150deg,#1a1d27,#0c0e13)", border: `1px solid ${C.border}`, boxShadow: "0 0 0 1px #ffffff06, 0 12px 48px -16px #f59e0b44" }}>
          <Flame size={18} color="#f59e0b" /><div className="text-sm" style={{ color: C.text }}>High-signal cheat sheet. Skim this the morning of.</div>
        </div>
        <G id="rv1" title="Command one-liners" icon={Terminal} color="#60a5fa">
          <div className="space-y-1.5">{REV_CMDS.map((c, i) => <div key={i} className="text-xs font-mono leading-relaxed break-words" style={{ color: C.code }}>{c}</div>)}</div>
        </G>
        <G id="rv2" title="Concept diffs" icon={Target} color="#a78bfa">
          <div className="space-y-2">{REV_DIFFS.map((d, i) => <div key={i} className="text-xs leading-relaxed"><span className="font-semibold" style={{ color: C.text }}>{d[0]}</span><span style={{ color: C.textDim }}> — {d[1]}</span></div>)}</div>
        </G>
        <G id="rv3" title="Memory hooks" icon={Lightbulb} color="#fbbf24">
          <div className="flex flex-col gap-1.5">{REV_HOOKS.map((h, i) => <div key={i} className="text-xs leading-relaxed rounded-lg px-3 py-2" style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text }}>{h}</div>)}</div>
        </G>
        <G id="rv4" title="Interview one-liners" icon={Brain} color="#34d399">
          <div className="space-y-1.5">{REV_INTERVIEW.map((q, i) => <div key={i} className="text-xs leading-relaxed flex gap-2" style={{ color: C.text }}><span style={{ color: "#34d399" }}>▸</span>{q}</div>)}</div>
        </G>
        <G id="rv5" title="Must-run sequences" icon={Settings} color="#38bdf8">
          <div className="space-y-2.5">{REV_SEQ.map((s, i) => <div key={i}><div className="text-xs font-semibold mb-1" style={{ color: C.text }}>{s.t}</div><Code>{s.s}</Code></div>)}</div>
        </G>
        <Footer />
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.text }}>
      <style>{`.nsb::-webkit-scrollbar{display:none}.nsb{scrollbar-width:none}pre::-webkit-scrollbar{height:6px}pre::-webkit-scrollbar-thumb{background:#2a2f3a;border-radius:3px}input::placeholder{color:#6b7280}`}</style>
      <div className="sticky top-0 z-20" style={{ background: "rgba(7,8,11,0.9)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: "linear-gradient(135deg,#3b82f6,#6366f1)", boxShadow: "0 4px 16px -4px #6366f1aa" }}><LifeBuoy size={20} color="#fff" /></div>
            <div><div className="text-sm font-semibold tracking-tight">CKA Refresh</div><div className="text-xs" style={{ color: C.textFaint }}>{micro(masteryPct)}</div></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { fx("tap"); setMuted((m) => !m); }} aria-label="toggle sound" className="flex items-center justify-center rounded-full transition-all active:scale-90" style={{ width: 36, height: 36, background: C.surface, border: `1px solid ${C.border}`, color: muted ? C.textFaint : "#60a5fa" }}>
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <Ring pct={masteryPct} size={40} stroke={4} color="#34d399"><span className="text-xs font-bold">{masteryPct}%</span></Ring>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-3 pb-2 overflow-x-auto nsb">
          <div className="flex gap-1.5">
            {SECTIONS.map((s) => {
              const Icon = s.icon; const active = tab === s.id;
              return (
                <button key={s.id} onClick={() => go(s.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium transition-all active:scale-95 shrink-0"
                  style={active ? { background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", boxShadow: "0 4px 14px -4px #6366f1aa" } : { background: C.surface, color: C.textDim, border: `1px solid ${C.border}` }}>
                  <Icon size={14} />{s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-5 pb-20">
        {tab === "dash" && <Dashboard />}
        {tab === "crash" && <Crash />}
        {tab === "cmd" && <CmdLab />}
        {tab === "yaml" && <YamlLib />}
        {tab === "traps" && <Traps />}
        {tab === "quiz" && <Quiz />}
        {tab === "gap" && <GapCheck />}
        {tab === "cram" && <Cram />}
        {tab === "rapid" && <Rapid />}
      </div>
    </div>
  );
}