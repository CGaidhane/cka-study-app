import { useState, useEffect } from "react";
import {
  LayoutDashboard, BookOpen, Terminal, FileCode, AlertTriangle, Brain, ListChecks,
  CalendarDays, Zap, Server, Boxes, Cpu, Network, Database, Shield, Wrench, Settings,
  Copy, Check, ChevronDown, Search, RotateCcw, Trash2, Eye, Lightbulb, LifeBuoy,
  Target, ArrowRight, Flame
} from "lucide-react";

/* ---------------- tokens ---------------- */
const C = {
  bg: "#08090c", surface: "#14161c", surface2: "#1b1e26",
  border: "#262a35", borderSoft: "#1f232c",
  text: "#e7e9ee", textDim: "#9aa1ad", textFaint: "#6b7280", code: "#cdd3df",
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
    analogy: `A kitchen brigade — many cooks (nodes) coordinated by one head chef (control plane).` },
  { key: "node", name: "Node", category: "Architecture", level: "must",
    what: `A single machine (VM or physical) that runs pods.`,
    why: `Pods need somewhere to actually execute — nodes provide CPU, memory and disk.`,
    when: `Need more capacity → add nodes. Less → remove them.`,
    example: `kubectl describe node <name>  → capacity, conditions, running pods`,
    analogy: `One cook's station. More stations = more dishes in parallel.` },
  { key: "controlplane", name: "Control plane", category: "Architecture", level: "must",
    what: `The brain: API server, scheduler, controller-manager and etcd (+ cloud-controller).`,
    why: `Something must decide what runs where, store desired state, and reconcile reality to it.`,
    when: `Always running. You mostly talk to it through the API server.`,
    example: `kube-apiserver is the front door — every request goes through it.`,
    analogy: `Head chef + the order-ticket board + the recipe book.` },
  { key: "worker", name: "Worker node", category: "Architecture", level: "must",
    what: `A node running kubelet + kube-proxy + a container runtime that hosts your pods.`,
    why: `Separates deciding (control plane) from doing (workers).`,
    when: `Where your actual app containers live.`,
    example: `kubelet talks to the API server and starts containers via containerd.`,
    analogy: `The line cooks who actually plate what the chef ordered.` },
  { key: "namespace", name: "Namespace", category: "Architecture", level: "must",
    what: `A virtual slice of the cluster for grouping and isolating resources.`,
    why: `Multi-team / multi-env separation, scoped names, quotas and RBAC.`,
    when: `Splitting dev/stage/prod or teams inside one cluster.`,
    example: `kubectl get pods -n payments`,
    analogy: `Apartments in one building — separate mailboxes, shared plumbing. Nodes, PVs and ClusterRoles are NOT namespaced.` },
  { key: "labels", name: "Labels", category: "Architecture", level: "must",
    what: `Key/value tags on objects, used for grouping and selection.`,
    why: `This is how Kubernetes finds related objects (a Service finds its pods).`,
    when: `Everywhere — they're the glue.`,
    example: `app: web   tier: frontend`,
    analogy: `Hashtags — searchable, used to group things.` },
  { key: "selectors", name: "Selectors", category: "Architecture", level: "must",
    what: `Queries that match objects by their labels.`,
    why: `Loose coupling — a Service targets whatever matches, not named pods.`,
    when: `Service→pods, Deployment→pods, NetworkPolicy targeting.`,
    example: `selector: { app: web }  → every pod labeled app=web`,
    analogy: `A search filter: "show me everything tagged #web." A Deployment's selector must match its pod template labels — and it's immutable.` },
  { key: "annotations", name: "Annotations", category: "Architecture", level: "good",
    what: `Non-identifying metadata (key/value) for tools — not for selection.`,
    why: `Attach info (build IDs, controller hints, descriptions) without affecting matching.`,
    when: `Ingress controller config, change-cause, tooling metadata.`,
    example: `nginx.ingress.kubernetes.io/rewrite-target: /`,
    analogy: `Margin notes — readable info, but you don't search by them. Labels identify; annotations describe.` },
  { key: "pod", name: "Pod", category: "Workloads", level: "must",
    what: `Smallest deployable unit — one or more containers sharing network and storage.`,
    why: `Some containers must live together (app + sidecar), sharing localhost and volumes.`,
    when: `Rarely created directly — usually via a controller.`,
    example: `A web container + a log-shipper sidecar in one pod, sharing localhost.`,
    analogy: `A lunchbox — the containers inside travel together and share compartments. Pods are mortal: never rely on a pod IP staying.` },
  { key: "replicaset", name: "ReplicaSet", category: "Workloads", level: "must",
    what: `Keeps N identical pod copies running.`,
    why: `Self-healing + scale — if a pod dies, it makes another.`,
    when: `Almost never directly — Deployments manage ReplicaSets for you.`,
    example: `replicas: 3  → always 3 pods; kill one, a new one appears.`,
    analogy: `A photocopier set to "always keep 3 copies on the desk."` },
  { key: "deployment", name: "Deployment", category: "Workloads", level: "must",
    what: `Declarative manager for ReplicaSets with rolling updates and rollbacks.`,
    why: `Ship new versions with zero downtime and undo the bad ones.`,
    when: `The default for stateless apps.`,
    example: `kubectl set image deploy/web web=nginx:1.27  → rolling update`,
    analogy: `A shift manager who swaps in new staff gradually and can call the old crew back.` },
  { key: "daemonset", name: "DaemonSet", category: "Workloads", level: "good",
    what: `Runs exactly one pod per node (or per matching node).`,
    why: `Node-level agents (logging, monitoring, CNI) must run everywhere.`,
    when: `Per-node infra: fluentd, node-exporter, network plugins.`,
    example: `A log collector pod auto-appears on every new node you add.`,
    analogy: `A smoke detector in every room — add a room, it gets one too.` },
  { key: "statefulset", name: "StatefulSet", category: "Workloads", level: "good",
    what: `Manages stateful pods with stable identity, ordered rollout and sticky storage.`,
    why: `Databases need stable network names and their own disk per replica.`,
    when: `Kafka, Postgres — anything where pod-0 ≠ pod-1.`,
    example: `Pods named db-0, db-1 with sticky PVCs data-db-0, data-db-1.`,
    analogy: `Assigned seats with name tags — each person keeps their seat and locker.` },
  { key: "probes", name: "Liveness / Readiness / Startup probes", category: "Workloads", level: "must",
    what: `Health checks. Liveness = restart if dead. Readiness = pull from Service if not ready. Startup = give slow boots time before liveness kicks in.`,
    why: `Auto-recover hung apps, avoid sending traffic to not-ready pods, don't kill slow starters.`,
    when: `Liveness for deadlocks, readiness for warmup/deps, startup for slow legacy apps.`,
    example: `readiness on /healthz fails → pod leaves the load balancer but is NOT restarted.`,
    analogy: `Liveness = "is it breathing? if not, reboot." Readiness = "ready for customers?" Startup = "still waking up, don't poke yet."` },
  { key: "configmap", name: "ConfigMap", category: "Workloads", level: "must",
    what: `Non-secret config (key/values or files) decoupled from the image.`,
    why: `Same image, different config per environment — no rebuilds.`,
    when: `Feature flags, URLs, config files, env vars.`,
    example: `Mount as env vars or as a file at /etc/config.`,
    analogy: `A sticky note of settings taped to the container, swappable any time. Not secret — base64 isn't encryption.` },
  { key: "requests", name: "Requests", category: "Scheduling", level: "must",
    what: `The CPU/memory a container is guaranteed — used by the scheduler to place pods.`,
    why: `The scheduler must know how much to reserve so nodes aren't oversold.`,
    when: `Always set them — unset requests = scheduling roulette.`,
    example: `requests: { cpu: 250m, memory: 256Mi }`,
    analogy: `A dinner reservation — the table is held for you.` },
  { key: "limits", name: "Limits", category: "Scheduling", level: "must",
    what: `The hard ceiling a container may use. Over memory → OOMKilled. Over CPU → throttled.`,
    why: `Stop one noisy pod from starving the whole node.`,
    when: `Always, to protect the neighbors.`,
    example: `limits: { memory: 512Mi }  → uses 600Mi → killed.`,
    analogy: `A spending cap on a card — hit it and you're throttled (CPU) or kicked out (memory). requests==limits → Guaranteed QoS.` },
  { key: "taints", name: "Taints", category: "Scheduling", level: "good",
    what: `A repellent on a node: "don't schedule here unless you tolerate me."`,
    why: `Reserve nodes (GPU, control-plane) for specific workloads.`,
    when: `Dedicated node pools; keeping pods off control-plane nodes.`,
    example: `kubectl taint nodes gpu1 gpu=true:NoSchedule`,
    analogy: `A "staff only" sign on a door. Pairs with tolerations.` },
  { key: "tolerations", name: "Tolerations", category: "Scheduling", level: "good",
    what: `A pod's permission to land on a tainted node.`,
    why: `Lets chosen pods bypass the repellent.`,
    when: `Scheduling GPU jobs onto tainted GPU nodes.`,
    example: `toleration for gpu=true:NoSchedule lets the pod schedule there.`,
    analogy: `The staff keycard that opens the "staff only" door. It only PERMITS — it doesn't attract. Use affinity to pull pods in.` },
  { key: "nodeaffinity", name: "Node affinity", category: "Scheduling", level: "good",
    what: `Rules that attract pods to nodes by node labels (soft/preferred or hard/required).`,
    why: `Place pods on the right hardware or zone.`,
    when: `"Run on SSD nodes" / "prefer zone-a".`,
    example: `requiredDuringScheduling...: disktype=ssd`,
    analogy: `"I want a window seat" — a preference or a hard requirement. Taints repel; affinity attracts.` },
  { key: "podaffinity", name: "Pod affinity", category: "Scheduling", level: "advanced",
    what: `Schedule a pod near other pods (by their labels) within a topology (node/zone).`,
    why: `Co-locate chatty services to cut latency.`,
    when: `Web pod near its cache pod.`,
    example: `affinity to app=cache in the same zone.`,
    analogy: `"Seat me next to my friend."` },
  { key: "antiaffinity", name: "Anti-affinity", category: "Scheduling", level: "advanced",
    what: `Keep a pod away from pods with given labels.`,
    why: `Spread replicas across nodes/zones for high availability.`,
    when: `Don't put all DB replicas on one node.`,
    example: `anti-affinity on app=db per hostname → one db per node.`,
    analogy: `"Don't seat the loud group together." Or use topologySpreadConstraints.` },
  { key: "service", name: "Service", category: "Networking", level: "must",
    what: `A stable virtual IP + DNS name that load-balances to a set of pods.`,
    why: `Pods come and go with changing IPs — clients need one fixed address.`,
    when: `Any time something must reach your pods reliably.`,
    example: `ClusterIP service "web" round-robins to all app=web pods.`,
    analogy: `A front-desk phone number — staff change, the number doesn't. Types: ClusterIP, NodePort, LoadBalancer, ExternalName.` },
  { key: "ingress", name: "Ingress", category: "Networking", level: "good",
    what: `HTTP(S) routing rules (host/path) into the cluster, handled by an ingress controller.`,
    why: `One entry point + TLS + name/path routing beats a LoadBalancer per service.`,
    when: `Exposing multiple HTTP services under domains/paths.`,
    example: `shop.com/api → api-svc,  shop.com/ → web-svc`,
    analogy: `A building receptionist routing visitors by name. Does nothing without a controller (nginx, traefik).` },
  { key: "dns", name: "DNS (CoreDNS)", category: "Networking", level: "must",
    what: `CoreDNS gives every service a name like svc.namespace.svc.cluster.local.`,
    why: `Hardcoding IPs is fragile — names are stable and discoverable.`,
    when: `Service-to-service calls inside the cluster.`,
    example: `curl http://web.default.svc.cluster.local`,
    analogy: `A phone book for the cluster — look up by name, get the number.` },
  { key: "pv", name: "PersistentVolume (PV)", category: "Storage", level: "must",
    what: `A cluster-level piece of real storage (EBS, NFS…), provisioned by admin or dynamically.`,
    why: `Decouple actual storage from pods so data survives pod death.`,
    when: `Any data that must outlive a pod.`,
    example: `A 10Gi EBS-backed PV available to be claimed.`,
    analogy: `A storage unit that exists independent of any tenant. PV = the supply.` },
  { key: "pvc", name: "PersistentVolumeClaim (PVC)", category: "Storage", level: "must",
    what: `A pod's request for storage (size + access mode) that binds to a PV.`,
    why: `Apps shouldn't know storage details — they just ask for "10Gi RWO".`,
    when: `Mounting durable storage into a pod.`,
    example: `PVC "data" 10Gi RWO → binds to a matching PV → mounted at /data.`,
    analogy: `The rental agreement that claims a unit. Pods mount PVCs, never PVs directly. PVC = the demand.` },
  { key: "storageclass", name: "StorageClass", category: "Storage", level: "must",
    what: `A template for dynamic provisioning (provisioner, params, reclaim policy).`,
    why: `Auto-create PVs on demand — no manual pre-provisioning.`,
    when: `Self-service storage; gp3 / fast-ssd tiers.`,
    example: `PVC with storageClassName: fast-ssd → a PV is auto-created.`,
    analogy: `A vending machine for storage units — pick a tier, one appears. No class + no matching PV → PVC stuck Pending.` },
  { key: "secret", name: "Secret", category: "Security", level: "must",
    what: `Like a ConfigMap but for sensitive data — base64-encoded, can be encrypted at rest.`,
    why: `Keep passwords/tokens/keys out of images and plaintext manifests.`,
    when: `DB passwords, API tokens, TLS certs.`,
    example: `type: kubernetes.io/tls for cert+key, mounted into the pod.`,
    analogy: `A locked drawer vs the ConfigMap's open sticky note. base64 ≠ encrypted — add encryption at rest + RBAC.` },
  { key: "rbac", name: "RBAC", category: "Security", level: "must",
    what: `Role-Based Access Control: who can do what on which resources.`,
    why: `Least privilege — stop accidental or malicious cluster-wide damage.`,
    when: `Always, in shared/prod clusters.`,
    example: `Role allows get/list pods in dev; a RoleBinding grants it to a user.`,
    analogy: `Building keycards — each opens only certain doors. Pieces: Role/ClusterRole (perms) + RoleBinding/ClusterRoleBinding (who).` },
  { key: "serviceaccount", name: "ServiceAccount", category: "Security", level: "must",
    what: `An identity for processes inside pods to talk to the API server.`,
    why: `Pods need authenticated, scoped access — not your human credentials.`,
    when: `Apps/controllers that call the Kubernetes API.`,
    example: `Pod uses SA "ci-bot"; RBAC grants it deploy rights.`,
    analogy: `A robot employee badge, separate from human staff badges. The default SA auto-mounts — lock it down if unused.` },
  { key: "cordon", name: "Cordon", category: "Cluster maintenance", level: "must",
    what: `Mark a node unschedulable — no new pods, existing ones stay.`,
    why: `Stop adding work before maintenance.`,
    when: `Step 1 of node maintenance.`,
    example: `kubectl cordon node1`,
    analogy: `Stop seating new customers; current diners keep eating.` },
  { key: "drain", name: "Drain", category: "Cluster maintenance", level: "must",
    what: `Cordon + safely evict existing pods (respecting PodDisruptionBudgets).`,
    why: `Empty a node before reboot/upgrade/removal.`,
    when: `Before patching or decommissioning a node.`,
    example: `kubectl drain node1 --ignore-daemonsets --delete-emptydir-data`,
    analogy: `Politely walk diners to other tables, then close the section. Drain = cordon + evict.` },
  { key: "uncordon", name: "Uncordon", category: "Cluster maintenance", level: "must",
    what: `Mark a node schedulable again.`,
    why: `Return it to the pool after maintenance.`,
    when: `After drain + reboot/upgrade.`,
    example: `kubectl uncordon node1`,
    analogy: `Reopen the section and start seating again.` },
  { key: "etcd", name: "etcd backup / restore", category: "Cluster maintenance", level: "advanced",
    what: `etcd is the cluster's source of truth — snapshot it and restore to recover.`,
    why: `Lose etcd = lose all cluster state. Backups are your lifeline.`,
    when: `Before upgrades; disaster recovery; a CKA exam favourite.`,
    example: `ETCDCTL_API=3 etcdctl snapshot save snap.db (with certs + endpoints)`,
    analogy: `A save-game file for the whole cluster. Restore creates a new data dir — point etcd at it.` },
  { key: "troubleshoot", name: "Troubleshooting basics", category: "Troubleshooting", level: "must",
    what: `The describe → logs → events → exec loop to find why things break.`,
    why: `Most failures show up in events, logs or describe before anything else.`,
    when: `Pod not Running/Ready, crashloops, pending pods.`,
    example: `describe pod (events) → logs (+ --previous) → get events → exec in`,
    analogy: `A doctor: vitals (describe), symptoms (logs), history (events), then poke around (exec).` },
];

/* ---------------- commands ---------------- */
const CMD_CATS = ["Inspect", "Create & apply", "Update", "Delete", "Debug", "Nodes & scheduling", "Config & context", "RBAC", "Exam speed"];
const CMD_CAT_COLOR = {
  Inspect: "#60a5fa", "Create & apply": "#34d399", Update: "#fbbf24", Delete: "#fb7185",
  Debug: "#f472b6", "Nodes & scheduling": "#38bdf8", "Config & context": "#a78bfa",
  RBAC: "#22d3ee", "Exam speed": "#f59e0b",
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
  { cat: "Config & context", cmd: `kubectl config get-contexts`, meaning: `List clusters/contexts`, when: `Multi-cluster` },
  { cat: "Config & context", cmd: `kubectl config use-context <c>`, meaning: `Switch cluster`, when: `Don't nuke prod by accident` },
  { cat: "Config & context", cmd: `kubectl config set-context --current --namespace=dev`, meaning: `Set default namespace`, when: `Stop typing -n` },
  { cat: "RBAC", cmd: `kubectl auth can-i create pods`, meaning: `Test your own permissions`, when: `Debug access` },
  { cat: "RBAC", cmd: `kubectl auth can-i list secrets --as=system:serviceaccount:dev:bot`, meaning: `Test as a ServiceAccount`, when: `Verify bindings` },
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
    key: `Namespaced → Role. Cluster-scoped or cross-namespace → ClusterRole.` },
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
];

/* ---------------- quiz ---------------- */
const QUIZ = [
  { type: "concept", topic: "Workloads", q: "Deployment vs ReplicaSet — what's the difference?", a: "A ReplicaSet just maintains N pods. A Deployment manages ReplicaSets and adds rolling updates, rollbacks and revision history. You use Deployments; they create ReplicaSets under the hood." },
  { type: "troubleshoot", topic: "Scheduling", q: "A pod is stuck in Pending. First things to check?", a: "kubectl describe pod → events. Usually insufficient resources, no node matches nodeSelector/affinity, a taint with no toleration, or an unbound PVC (no matching PV / storageClass)." },
  { type: "troubleshoot", topic: "Workloads", q: "A pod is in CrashLoopBackOff. How do you find the cause?", a: "kubectl logs <pod> --previous for the crashed container, then describe for exit codes/events. Common: bad command, missing config/secret, failing liveness probe, or OOMKilled." },
  { type: "concept", topic: "Scheduling", q: "requests vs limits — what does each control?", a: "requests = resources the scheduler guarantees/reserves. limits = hard ceiling. Exceed the memory limit → OOMKilled; exceed CPU → throttled." },
  { type: "scenario", topic: "Workloads", q: "You need a DB with stable network identity and its own disk per replica. Which controller?", a: "A StatefulSet — stable pod names (db-0, db-1), ordered rollout, and a sticky PVC per pod." },
  { type: "concept", topic: "Maintenance", q: "cordon vs drain?", a: "cordon marks a node unschedulable (existing pods stay). drain does that and also evicts existing pods (respecting PDBs). Drain before maintenance." },
  { type: "scenario", topic: "Workloads", q: "Run a log collector on every node, including new ones. What do you use?", a: "A DaemonSet — one pod per node, auto-scheduled onto any node you add." },
  { type: "concept", topic: "Networking", q: "Why does a Service exist if pods already have IPs?", a: "Pod IPs are ephemeral and change on restart/reschedule. A Service gives a stable virtual IP + DNS name and load-balances across matching pods." },
  { type: "troubleshoot", topic: "Networking", q: "A Service returns no endpoints. Why?", a: "Its selector doesn't match any running/ready pods, or pods are failing readiness. Check kubectl get endpoints <svc> and the label match." },
  { type: "concept", topic: "Networking", q: "What does an Ingress need to actually work?", a: "An ingress controller (nginx, traefik, etc.) running in the cluster. The Ingress object alone is just routing rules." },
  { type: "interview", topic: "Security", q: "How do the RBAC pieces fit together?", a: "Role/ClusterRole define permissions; RoleBinding/ClusterRoleBinding attach them to a subject (user, group, or ServiceAccount). Role = namespaced, ClusterRole = cluster-wide." },
  { type: "scenario", topic: "Security", q: "An app in a pod must call the Kubernetes API. How do you give it scoped access?", a: "Create a ServiceAccount, grant permissions via a (Cluster)RoleBinding, and set serviceAccountName on the pod." },
  { type: "concept", topic: "Storage", q: "PV vs PVC?", a: "PV is the actual storage resource (supply); PVC is a pod's request that binds to a PV (demand). Pods mount PVCs." },
  { type: "troubleshoot", topic: "Storage", q: "A PVC is stuck Pending. Likely reasons?", a: "No matching PV (size/accessMode), no or incorrect storageClass for dynamic provisioning, or the provisioner isn't running." },
  { type: "concept", topic: "Storage", q: "What does a StorageClass do?", a: "Enables dynamic provisioning — defines the provisioner, parameters and reclaim policy so PVs are created on demand for matching PVCs." },
  { type: "interview", topic: "Workloads", q: "liveness vs readiness probe — the practical difference?", a: "Liveness failing restarts the container; readiness failing removes the pod from Service endpoints (no restart). Readiness for warmup/dependencies, liveness for deadlocks." },
  { type: "scenario", topic: "Scheduling", q: "You want replicas spread across nodes for HA. What do you configure?", a: "Pod anti-affinity (or topologySpreadConstraints) on the pod's own label across kubernetes.io/hostname." },
  { type: "concept", topic: "Scheduling", q: "Taint vs toleration — does a toleration place the pod?", a: "A taint repels pods from a node; a toleration lets a pod tolerate it. A toleration only permits scheduling — it doesn't attract. Use node affinity/nodeSelector to attract." },
  { type: "troubleshoot", topic: "Architecture", q: "kubectl get pods shows nothing, but you know pods exist. Why?", a: "Wrong namespace. Add -n <ns> or -A. Your context's default namespace may differ." },
  { type: "interview", topic: "Workloads", q: "How do you do a zero-downtime image update and roll back if it fails?", a: "kubectl set image deploy/web web=img:tag (rolling update), watch kubectl rollout status, and kubectl rollout undo deploy/web to revert." },
  { type: "concept", topic: "Security", q: "ConfigMap vs Secret — the real difference?", a: "Mechanically similar. Secrets are meant for sensitive data — base64-encoded and can be encrypted at rest + RBAC-restricted. base64 alone is not encryption." },
  { type: "scenario", topic: "Workloads", q: "Run a one-off DB migration that completes once and stops. Which object?", a: "A Job (restartPolicy: Never or OnFailure). For scheduled repeats, a CronJob." },
  { type: "troubleshoot", topic: "Architecture", q: "A node shows NotReady. Where do you look?", a: "kubectl describe node conditions, then the kubelet and container runtime (and CNI/network). Could be kubelet down, disk/memory pressure, or a network plugin issue." },
  { type: "interview", topic: "Maintenance", q: "How do you back up cluster state and why does it matter?", a: "Snapshot etcd (etcdctl snapshot save with certs/endpoints). etcd holds all cluster state — losing it loses the cluster. Restore creates a new data dir to point etcd at." },
  { type: "concept", topic: "Architecture", q: "What is a namespace good for, and what isn't namespaced?", a: "Grouping/isolating resources, scoping names, quotas and RBAC. Cluster-scoped objects like nodes, PersistentVolumes and ClusterRoles are not namespaced." },
  { type: "scenario", topic: "Scheduling", q: "Pods won't schedule onto a tainted GPU node. Two things needed?", a: "A matching toleration (to be allowed) and usually node affinity/nodeSelector (to be attracted to those nodes)." },
  { type: "troubleshoot", topic: "Networking", q: "An app can't resolve another service by name. What do you check?", a: "CoreDNS pods/health, the exact DNS name (svc.ns.svc.cluster.local), and whether the target Service has endpoints. Test from a debug pod with nslookup/curl." },
  { type: "interview", topic: "Networking", q: "Difference between ClusterIP, NodePort and LoadBalancer?", a: "ClusterIP = internal-only stable IP. NodePort = opens a static port on every node. LoadBalancer = provisions an external cloud LB (builds on NodePort)." },
  { type: "concept", topic: "Workloads", q: "Why must a Deployment's selector match its pod template labels?", a: "The selector is how the Deployment/ReplicaSet adopts and manages its pods. A mismatch means it can't own them — and the selector is immutable after creation." },
  { type: "scenario", topic: "Maintenance", q: "You're upgrading a node's kernel. Safe sequence?", a: "cordon → drain --ignore-daemonsets --delete-emptydir-data → patch/reboot → uncordon. Respect PodDisruptionBudgets." },
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
    learn: ["requests vs limits & QoS classes", "Taints & tolerations", "Node / pod / anti-affinity", "nodeSelector basics"],
    practice: ["Taint a node, then tolerate it", "Spread replicas with anti-affinity", "Set requests/limits on a pod"],
    memorize: ["requests vs limits", "taint repels vs affinity attracts"],
    troubleshoot: ["Fix a Pending pod (resources / affinity / taint)"] },
  { day: 4, focus: "Networking", color: "#22d3ee",
    learn: ["Service types: ClusterIP / NodePort / LoadBalancer", "Cluster DNS & service names", "Ingress + controller", "NetworkPolicy basics"],
    practice: ["Expose a deployment as a Service", "port-forward to test", "Write a deny-all NetworkPolicy"],
    memorize: ["DNS format svc.ns.svc.cluster.local", "Service vs Ingress"],
    troubleshoot: ["Service with no endpoints / DNS resolution fail"] },
  { day: 5, focus: "Storage", color: "#34d399",
    learn: ["PV, PVC, binding", "StorageClass & dynamic provisioning", "Access modes RWO / ROX / RWX", "Reclaim policies"],
    practice: ["Create a PVC and mount it", "Dynamic provisioning via a StorageClass"],
    memorize: ["PV vs PVC", "Access modes"],
    troubleshoot: ["PVC stuck Pending"] },
  { day: 6, focus: "Security & RBAC", color: "#fb7185",
    learn: ["Role / ClusterRole + bindings", "ServiceAccounts", "Secrets & encryption at rest", "Contexts & namespaces"],
    practice: ["Create a role + rolebinding", "auth can-i checks", "Create and mount a Secret"],
    memorize: ["The 4 RBAC objects", "Role vs ClusterRole"],
    troubleshoot: ["Resolve a 'forbidden' error with auth can-i --as"] },
  { day: 7, focus: "Maintenance, troubleshooting & mock", color: "#38bdf8",
    learn: ["cordon / drain / uncordon", "etcd backup & restore", "Cluster upgrade flow (kubeadm)"],
    practice: ["Drain and uncordon a node", "etcd snapshot save & restore", "Run a full mock with Quiz Mode"],
    memorize: ["cordon vs drain", "etcdctl snapshot command + flags"],
    troubleshoot: ["End-to-end: describe → logs → events → exec"] },
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
  `k auth can-i <verb> <res> --as <sa>  — debug RBAC`,
  `k config set-context --current --namespace=dev  — stop typing -n`,
  `k explain <res> --recursive  — field tree offline`,
  `k get events --sort-by=.metadata.creationTimestamp  — what just broke`,
  `ETCDCTL_API=3 etcdctl snapshot save snap.db  — back up the cluster`,
];
const REV_DIFFS = [
  ["requests vs limits", "scheduled/guaranteed vs hard cap (mem→OOMKill, cpu→throttle)"],
  ["probes", "liveness restarts · readiness pulls traffic · startup shields slow boots"],
  ["cordon/drain/uncordon", "no new pods · cordon+evict · re-enable"],
  ["PV vs PVC", "the storage vs the claim — pods mount PVCs"],
  ["Role vs ClusterRole", "namespaced vs cluster-wide / non-namespaced"],
  ["Service vs Ingress", "stable L4 address vs L7 HTTP router (needs controller)"],
  ["Deployment vs ReplicaSet", "manages rollouts vs just keeps N alive"],
  ["labels vs annotations", "select by these vs metadata, never selected"],
  ["taint/affinity/toleration", "repels · attracts · only permits"],
  ["ClusterIP/NodePort/LB", "internal · port-per-node · cloud LB (superset)"],
  ["StatefulSet vs Deployment", "stable name + sticky PVC vs interchangeable pods"],
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
  "CrashLoopBackOff → logs --previous; check config/secret, command, OOM, probes.",
  "Zero-downtime deploy → rolling update; rollout undo to revert.",
  "Spread replicas for HA → pod anti-affinity / topologySpreadConstraints.",
  "Pod needs API access → ServiceAccount + RBAC binding.",
  "Service has no endpoints → selector/label mismatch or failing readiness.",
  "Node maintenance → cordon, drain --ignore-daemonsets, patch, uncordon.",
  "Lost cluster → restore etcd from snapshot.",
];
const REV_SEQ = [
  { t: "Node maintenance", s: `cordon → drain --ignore-daemonsets --delete-emptydir-data → patch/reboot → uncordon` },
  { t: "etcd backup", s: `ETCDCTL_API=3 etcdctl snapshot save snap.db --endpoints=… --cacert=… --cert=… --key=…` },
  { t: "etcd restore", s: `etcdctl snapshot restore snap.db --data-dir=/var/lib/etcd-new → point etcd at it → restart` },
];

/* ---------------- shared UI ---------------- */
function Ring({ pct, size = 44, stroke = 4, color = "#34d399", children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c - (pct / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={C.border} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .6s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}
function Bar({ pct, color }) {
  return <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
    <div className="h-full rounded-full" style={{ width: pct + "%", background: color, transition: "width .5s" }} /></div>;
}
function Chip({ active, label, icon: Icon, color, onClick }) {
  return <button onClick={onClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium transition shrink-0"
    style={active ? { background: color || "#fff", color: "#08090c", border: "1px solid transparent" } : { background: C.surface, color: C.textDim, border: `1px solid ${C.border}` }}>
    {Icon && <Icon size={13} />}{label}</button>;
}
function LevelBadge({ level }) {
  const l = LEVELS[level];
  return <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: l.c + "1f", color: l.c }}>{l.label}</span>;
}
function Lbl({ children }) {
  return <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.textFaint }}>{children}</div>;
}
function Field({ label, children }) {
  return <div><Lbl>{label}</Lbl><div className="text-xs mt-1 leading-relaxed" style={{ color: C.text }}>{children}</div></div>;
}
function Code({ children }) {
  return <pre className="rounded-lg px-3 py-2 text-xs font-mono overflow-x-auto leading-relaxed" style={{ background: "#0b0d12", border: `1px solid ${C.border}`, color: C.code }}>{children}</pre>;
}
function CopyBtn({ text, id, copied, onCopy }) {
  const isC = copied === id;
  return <button onClick={() => onCopy(text, id)} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs shrink-0"
    style={{ background: C.surface2, color: isC ? "#34d399" : C.textDim, border: `1px solid ${C.border}` }}>
    {isC ? <Check size={12} /> : <Copy size={12} />}{isC ? "Copied" : "Copy"}</button>;
}
function StatusBtn({ active, color, label, onClick }) {
  return <button onClick={onClick} className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition"
    style={active ? { background: color, color: "#08090c", border: "1px solid transparent" } : { background: C.surface2, color: C.textDim, border: `1px solid ${C.border}` }}>{label}</button>;
}
function Stat({ value, label, color }) {
  return <div className="rounded-xl px-2 py-2.5 text-center" style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
    <div className="text-base font-bold" style={{ color: color || C.text }}>{value}</div>
    <div className="text-xs mt-0.5" style={{ color: C.textFaint }}>{label}</div></div>;
}
function Footer() {
  return <div className="text-center text-xs pt-2 pb-2" style={{ color: C.textFaint }}>Progress saves on this device · built for a fast refresh</div>;
}
const micro = (p) => p >= 100 ? "Cluster-certified energy" : p >= 80 ? "Looking exam-ready" : p >= 60 ? "Halfway sharp" : p >= 40 ? "Building momentum" : p >= 20 ? "Warming up" : "Cold start";
const BLOCKS = [
  { k: "learn", label: "Learn", c: "#60a5fa" },
  { k: "practice", label: "Practice", c: "#34d399" },
  { k: "memorize", label: "Memorize", c: "#fbbf24" },
  { k: "troubleshoot", label: "Troubleshoot", c: "#fb7185" },
];

/* ---------------- app ---------------- */
const SK = "cka_progress_v1";
export default function App() {
  const [tab, setTab] = useState("dash");
  const [crashCat, setCrashCat] = useState("All");
  const [crashLevel, setCrashLevel] = useState("All");
  const [cmdSearch, setCmdSearch] = useState("");
  const [cmdCat, setCmdCat] = useState("All");
  const [open, setOpen] = useState({});
  const [copied, setCopied] = useState(null);
  const [progress, setProgress] = useState({ gap: {}, quiz: {}, cram: {} });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let a = true;
    (async () => {
      try {
        if (window.storage && window.storage.get) {
          const r = await window.storage.get(SK);
          if (a && r && r.value) {
            const p = JSON.parse(r.value);
            setProgress({ gap: p.gap || {}, quiz: p.quiz || {}, cram: p.cram || {} });
          }
        }
      } catch (e) { /* no stored data */ }
      finally { if (a) setLoaded(true); }
    })();
    return () => { a = false; };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try { if (window.storage && window.storage.set) await window.storage.set(SK, JSON.stringify(progress)); } catch (e) {}
    })();
  }, [progress, loaded]);
  useEffect(() => { try { window.scrollTo(0, 0); } catch (e) {} }, [tab]);

  const tog = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));
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
  const setGap = (k, v) => setProgress((p) => { const g = { ...p.gap }; if (g[k] === v) delete g[k]; else g[k] = v; return { ...p, gap: g }; });
  const setQ = (i, patch) => setProgress((p) => ({ ...p, quiz: { ...p.quiz, [i]: { ...(p.quiz[i] || {}), ...patch } } }));
  const togCram = (id) => setProgress((p) => { const c = { ...p.cram }; if (c[id]) delete c[id]; else c[id] = true; return { ...p, cram: c }; });
  const resetQuiz = () => setProgress((p) => ({ ...p, quiz: {} }));
  const clearGap = () => setProgress((p) => ({ ...p, gap: {} }));

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

  /* ---- sections ---- */
  const Dashboard = () => (
    <div className="space-y-5">
      <div className="rounded-2xl p-5" style={{ background: "linear-gradient(160deg,#14161c,#0e1014)", border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-4">
          <Ring pct={masteryPct} size={72} stroke={6} color="#34d399"><span className="text-base font-bold">{masteryPct}%</span></Ring>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-wide" style={{ color: C.textFaint }}>Mastery</div>
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
          <span key={k} className="flex items-center gap-1.5"><span className="inline-block rounded-full" style={{ width: 8, height: 8, background: l.c }} />{l.label}</span>
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
              <button key={cat} onClick={() => { setCrashCat(cat); setCrashLevel("All"); setTab("crash"); }}
                className="text-left rounded-2xl p-3.5 transition" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: acc.c + "1f" }}><Icon size={16} color={acc.c} /></span>
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

  const Crash = () => {
    const filtered = CONCEPTS.filter((c) => (crashCat === "All" || c.category === crashCat) && (crashLevel === "All" || c.level === crashLevel));
    return (
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1 nsb">
          <Chip active={crashCat === "All"} label="All" onClick={() => setCrashCat("All")} />
          {CATEGORIES.map((cat) => <Chip key={cat} active={crashCat === cat} label={cat} color={CAT[cat].c} icon={CAT[cat].icon} onClick={() => setCrashCat(cat)} />)}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 nsb">
          <Chip active={crashLevel === "All"} label="All levels" onClick={() => setCrashLevel("All")} />
          {Object.entries(LEVELS).map(([k, l]) => <Chip key={k} active={crashLevel === k} label={l.label} color={l.c} onClick={() => setCrashLevel(k)} />)}
        </div>
        <div className="text-xs" style={{ color: C.textFaint }}>{filtered.length} concepts</div>
        <div className="space-y-2.5">
          {filtered.map((c) => {
            const id = "cr-" + c.key; const o = open[id];
            const st = progress.gap[c.key]; const sc = st ? STATUS[st] : null;
            return (
              <div key={c.key} className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${sc ? sc.c : "transparent"}` }}>
                <button onClick={() => tog(id)} className="w-full text-left px-4 py-3 flex items-center gap-3">
                  <span className="inline-block rounded-full shrink-0" style={{ width: 8, height: 8, background: CAT[c.category].c }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap"><span className="text-sm font-semibold" style={{ color: C.text }}>{c.name}</span><LevelBadge level={c.level} /></div>
                    {!o && <div className="text-xs mt-0.5 truncate" style={{ color: C.textDim }}>{c.what}</div>}
                  </div>
                  <ChevronDown size={16} color={C.textFaint} style={{ transform: o ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                </button>
                {o && (
                  <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${C.borderSoft}`, paddingTop: 12 }}>
                    <Field label="What it is">{c.what}</Field>
                    <Field label="Why it exists">{c.why}</Field>
                    <Field label="When to use">{c.when}</Field>
                    <div><Lbl>Example</Lbl><div className="mt-1"><Code>{c.example}</Code></div></div>
                    <div className="rounded-lg px-3 py-2.5 flex gap-2" style={{ background: "#fbbf2414", border: "1px solid #fbbf2433" }}>
                      <Lightbulb size={15} color="#fbbf24" className="shrink-0" style={{ marginTop: 2 }} />
                      <div className="text-xs leading-relaxed"><span className="font-semibold" style={{ color: "#fbbf24" }}>Memory hook · </span><span style={{ color: C.text }}>{c.analogy}</span></div>
                    </div>
                    <div><Lbl>How solid are you?</Lbl>
                      <div className="flex gap-2 mt-1.5">{["know", "weak", "revise"].map((v) => <StatusBtn key={v} active={st === v} color={STATUS[v].c} label={STATUS[v].label} onClick={() => setGap(c.key, v)} />)}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Footer />
      </div>
    );
  };

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
          <Chip active={cmdCat === "All"} label="All" onClick={() => setCmdCat("All")} />
          {CMD_CATS.map((cat) => <Chip key={cat} active={cmdCat === cat} label={cat} color={CMD_CAT_COLOR[cat]} onClick={() => setCmdCat(cat)} />)}
        </div>
        <div className="space-y-4">
          {cats.map((cat) => {
            const items = COMMANDS.filter((c) => c.cat === cat && match(c));
            if (!items.length) return null;
            const col = CMD_CAT_COLOR[cat];
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2"><span className="inline-block rounded-full" style={{ width: 8, height: 8, background: col }} /><span className="text-sm font-semibold" style={{ color: C.text }}>{cat}</span><span className="text-xs" style={{ color: C.textFaint }}>{items.length}</span></div>
                <div className="space-y-2">
                  {items.map((c, i) => {
                    const id = cat + i;
                    return (
                      <div key={i} className="rounded-xl px-3.5 py-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
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

  const YamlLib = () => (
    <div className="space-y-2.5">
      {YAML.map((t, i) => {
        const id = "y-" + i; const o = open[id]; const acc = CAT[t.category];
        return (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <button onClick={() => tog(id)} className="w-full px-4 py-3 flex items-center gap-3 text-left">
              <FileCode size={15} color={acc.c} className="shrink-0" />
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold" style={{ color: C.text }}>{t.name}</div><div className="text-xs mt-0.5" style={{ color: C.textDim }}>{t.note}</div></div>
              <ChevronDown size={16} color={C.textFaint} style={{ transform: o ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            {o && (
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${C.borderSoft}`, paddingTop: 12 }}>
                <div className="flex justify-end"><CopyBtn text={t.yaml} id={id} copied={copied} onCopy={copy} /></div>
                <Code>{t.yaml}</Code>
                <div className="rounded-lg px-3 py-2.5 flex gap-2" style={{ background: "#fb718514", border: "1px solid #fb718533" }}>
                  <AlertTriangle size={15} color="#fb7185" className="shrink-0" style={{ marginTop: 2 }} />
                  <div className="text-xs leading-relaxed"><span className="font-semibold" style={{ color: "#fb7185" }}>Common mistake · </span><span style={{ color: C.text }}>{t.mistake}</span></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <Footer />
    </div>
  );

  const Traps = () => (
    <div className="space-y-2.5">
      {TRAPS.map((t, i) => {
        const id = "t-" + i; const o = open[id];
        return (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <button onClick={() => tog(id)} className="w-full px-4 py-3 flex items-center gap-3 text-left">
              <AlertTriangle size={15} color="#fbbf24" className="shrink-0" />
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold" style={{ color: C.text }}>{t.title}</div>{!o && <div className="text-xs mt-0.5" style={{ color: C.textFaint }}>tap to compare</div>}</div>
              <ChevronDown size={16} color={C.textFaint} style={{ transform: o ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            {o && (
              <div className="px-4 pb-4 space-y-2" style={{ borderTop: `1px solid ${C.borderSoft}`, paddingTop: 12 }}>
                {t.items.map((it, j) => (
                  <div key={j} className="rounded-lg px-3 py-2" style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
                    <span className="text-xs font-semibold" style={{ color: C.text }}>{it.name}</span>
                    <div className="text-xs mt-0.5" style={{ color: C.textDim }}>{it.desc}</div>
                  </div>
                ))}
                <div className="rounded-lg px-3 py-2.5 flex gap-2" style={{ background: "#60a5fa14", border: "1px solid #60a5fa33" }}>
                  <Target size={15} color="#60a5fa" className="shrink-0" style={{ marginTop: 2 }} />
                  <div className="text-xs leading-relaxed"><span className="font-semibold" style={{ color: "#60a5fa" }}>The catch · </span><span style={{ color: C.text }}>{t.key}</span></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <Footer />
    </div>
  );

  const Quiz = () => (
    <div className="space-y-3">
      <div className="rounded-2xl p-4" style={{ background: "linear-gradient(160deg,#14161c,#0e1014)", border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold" style={{ color: C.text }}>{qReviewed}/{QUIZ.length} reviewed · {qCorrect} correct</div>
          <button onClick={resetQuiz} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md" style={{ background: C.surface2, color: C.textDim, border: `1px solid ${C.border}` }}><RotateCcw size={12} />Reset</button>
        </div>
        <Bar pct={Math.round((qReviewed / QUIZ.length) * 100)} color="#a78bfa" />
      </div>
      {QUIZ.map((q, i) => {
        const s = progress.quiz[i] || {}; const tc = QTYPES[q.type];
        const bord = s.mark === "got" ? "#34d39955" : s.mark === "missed" ? "#fb718555" : C.border;
        return (
          <div key={i} className="rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${bord}` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: tc.c + "1f", color: tc.c }}>{tc.label}</span>
              <span className="text-xs" style={{ color: C.textFaint }}>{q.topic}</span>
              <span className="ml-auto text-xs" style={{ color: C.textFaint }}>{i + 1}/{QUIZ.length}</span>
            </div>
            <div className="text-sm font-medium leading-snug" style={{ color: C.text }}>{q.q}</div>
            {!s.revealed ? (
              <button onClick={() => setQ(i, { revealed: true })} className="mt-3 w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5" style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}` }}><Eye size={14} />Reveal answer</button>
            ) : (
              <>
                <div className="mt-3 rounded-lg px-3 py-2.5 text-xs leading-relaxed" style={{ background: "#0b0d12", border: `1px solid ${C.border}`, color: C.code }}>{q.a}</div>
                <div className="flex gap-2 mt-2.5">
                  <StatusBtn active={s.mark === "got"} color="#34d399" label="Got it" onClick={() => setQ(i, { mark: s.mark === "got" ? null : "got" })} />
                  <StatusBtn active={s.mark === "missed"} color="#fb7185" label="Missed it" onClick={() => setQ(i, { mark: s.mark === "missed" ? null : "missed" })} />
                </div>
              </>
            )}
          </div>
        );
      })}
      <Footer />
    </div>
  );

  const GapCheck = () => (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: "linear-gradient(160deg,#14161c,#0e1014)", border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold" style={{ color: C.text }}>Self-assessment</div>
          <button onClick={clearGap} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md" style={{ background: C.surface2, color: C.textDim, border: `1px solid ${C.border}` }}><Trash2 size={12} />Clear</button>
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
            <div className="flex items-center gap-2 mb-2"><span className="inline-block rounded-full" style={{ width: 8, height: 8, background: CAT[cat].c }} /><span className="text-sm font-semibold" style={{ color: C.text }}>{cat}</span><span className="ml-auto text-xs" style={{ color: C.textFaint }}>{kn}/{list.length}</span></div>
            <div className="space-y-2">
              {list.map((c) => {
                const st = progress.gap[c.key];
                return (
                  <div key={c.key} className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex-1 min-w-0 text-sm truncate" style={{ color: C.text }}>{c.name}</div>
                    <div className="flex gap-1.5 shrink-0">
                      {["know", "weak", "revise"].map((v) => (
                        <button key={v} onClick={() => setGap(c.key, v)} className="px-2 py-1 rounded-md text-xs font-medium transition"
                          style={st === v ? { background: STATUS[v].c, color: "#08090c", border: "1px solid transparent" } : { background: C.surface2, color: C.textFaint, border: `1px solid ${C.border}` }}>{STATUS[v].label}</button>
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

  const Cram = () => (
    <div className="space-y-3">
      <div className="rounded-2xl p-4" style={{ background: "linear-gradient(160deg,#14161c,#0e1014)", border: `1px solid ${C.border}` }}>
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
          <div key={di} className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${d.color}` }}>
            <button onClick={() => setOpen((s) => ({ ...s, [id]: !(s[id] === undefined ? di === 0 : s[id]) }))} className="w-full px-4 py-3 flex items-center gap-3 text-left">
              <Ring pct={dp} size={34} stroke={3.5} color={d.color}><span className="text-xs font-bold" style={{ color: C.text }}>{d.day}</span></Ring>
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold" style={{ color: C.text }}>Day {d.day} · {d.focus}</div><div className="text-xs mt-0.5" style={{ color: C.textFaint }}>{dd}/{dayTasks.length} done</div></div>
              <ChevronDown size={16} color={C.textFaint} style={{ transform: o ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            {o && (
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${C.borderSoft}`, paddingTop: 12 }}>
                {BLOCKS.map((b) => (
                  <div key={b.k}>
                    <div className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: b.c }}>{b.label}</div>
                    <div className="space-y-1">
                      {(d[b.k] || []).map((it, ii) => {
                        const tid = `cr-${di}-${b.k}-${ii}`; const done = !!progress.cram[tid];
                        return (
                          <button key={ii} onClick={() => togCram(tid)} className="w-full flex items-start gap-2.5 text-left py-1">
                            <span className="flex items-center justify-center rounded-md shrink-0" style={{ width: 18, height: 18, marginTop: 1, background: done ? b.c : "transparent", border: `1.5px solid ${done ? b.c : C.border}` }}>{done && <Check size={12} color="#08090c" />}</span>
                            <span className="text-xs leading-relaxed" style={{ color: done ? C.textFaint : C.text, textDecoration: done ? "line-through" : "none" }}>{it}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <Footer />
    </div>
  );

  const Rapid = () => {
    const G = ({ id, title, icon: Icon, color, children }) => {
      const o = open[id] === undefined ? true : open[id];
      return (
        <div className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <button onClick={() => setOpen((s) => ({ ...s, [id]: !(s[id] === undefined ? true : s[id]) }))} className="w-full px-4 py-3 flex items-center gap-2.5 text-left">
            <Icon size={15} color={color} className="shrink-0" />
            <div className="flex-1 text-sm font-semibold" style={{ color: C.text }}>{title}</div>
            <ChevronDown size={16} color={C.textFaint} style={{ transform: o ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
          </button>
          {o && <div className="px-4 pb-4" style={{ borderTop: `1px solid ${C.borderSoft}`, paddingTop: 12 }}>{children}</div>}
        </div>
      );
    };
    return (
      <div className="space-y-2.5">
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "linear-gradient(160deg,#14161c,#0e1014)", border: `1px solid ${C.border}` }}>
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
      <div className="sticky top-0 z-20" style={{ background: "rgba(8,9,12,0.88)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}><LifeBuoy size={20} color="#fff" /></div>
            <div><div className="text-sm font-semibold tracking-tight">CKA Refresh</div><div className="text-xs" style={{ color: C.textFaint }}>{micro(masteryPct)}</div></div>
          </div>
          <Ring pct={masteryPct} size={40} stroke={4} color="#34d399"><span className="text-xs font-bold">{masteryPct}%</span></Ring>
        </div>
        <div className="max-w-2xl mx-auto px-3 pb-2 overflow-x-auto nsb">
          <div className="flex gap-1.5">
            {SECTIONS.map((s) => {
              const Icon = s.icon; const active = tab === s.id;
              return (
                <button key={s.id} onClick={() => setTab(s.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium transition shrink-0"
                  style={active ? { background: "#fff", color: "#08090c" } : { background: C.surface, color: C.textDim, border: `1px solid ${C.border}` }}>
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