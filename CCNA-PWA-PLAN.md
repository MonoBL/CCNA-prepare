# CCNA 200-301 Study PWA - Build & Content Plan

> Planning document for a Progressive Web App that prepares a student to **pass the Cisco CCNA 200-301 exam**.
> It defines the features (pre-assessment, topic study, question bank, labs, full timed exam), the content backbone (official Cisco exam blueprint), the data model, and a verified resource map (Cisco docs + Jeremy's IT Lab videos + the Cisco official course).

---

## 0. Truth & sourcing policy (read first)

This plan is built on primary sources only. Nothing about exam topics, weights, or device behavior is invented.

- **Exam blueprint, weights, sub-topics**: extracted verbatim from the official Cisco PDF `CCNA Exam v1.1 (200-301)`.
- **Exam logistics** (duration, cost): from the official Cisco exam page. Items Cisco does **not** publish (exact question count, passing score) are flagged as such, never guessed.
- **All Cisco documentation links** in this plan were tested and returned **HTTP 200** from a normal browser request during research. (Cisco's CDN returns `403` to automated bots, so a `403` on a script is a bot-block, not a dead page. Every link below was re-checked with a browser user-agent.)
- **Every question and lab built for this app must cite a Cisco doc or the Cisco Official Cert Guide.** No item ships without a verifiable rationale.

### Exam version warning (important, dated 2026-06-01)
- **Current live exam: 200-301 v1.1** (candidates test on this version since 20 Aug 2024). This plan targets v1.1.
- **Next version: 200-301 v2.0**, announced May 2026, **goes live 03 Feb 2027**. It restructures the blueprint into **5 domains** with heavier troubleshooting and AI focus. The exam *number* stays 200-301.
- **Action**: if the student sits the exam **before 03 Feb 2027**, study v1.1 (this plan). If after, plan a v2.0 content update. Build the app's blueprint as **data**, not hard-code, so a version swap is a JSON change.

---

## 1. Goal & success criteria

**Goal**: a student using this PWA end-to-end is ready to pass 200-301 v1.1.

**Success criteria (app KPIs)**
- Diagnostic-to-final readiness improvement tracked per domain.
- ≥ 85% average on full-exam simulations across two consecutive attempts before the student books the real exam.
- 100% blueprint sub-topic coverage (every numbered topic has ≥ 1 study card, ≥ 3 questions, and a linked resource).
- Every wrong answer shows **why it is wrong** and **why the right one is right**, with a source link.

---

## 2. The real exam (verified facts)

| Attribute | Value | Confidence / Source |
|---|---|---|
| Exam code / version | **200-301**, version **v1.1** | Official Cisco exam-topics PDF |
| Duration | **120 minutes** | Official Cisco exam page + exam-topics PDF |
| Cost | **USD $300** (+ tax) | Official Cisco exam page (via Pearson VUE) |
| Number of questions | **~100-120** (commonly ~100) | **Not officially published by Cisco.** Community/Pearson estimate |
| Question types | Multiple choice (single answer), multiple choice (multiple answer), drag-and-drop, **Sim**, **Simlet**, **Testlet** | Pearson IT Certification exam profile |
| Images / diagrams | **Yes** - topology diagrams and CLI exhibits are central to sims/simlets/testlets | Multiple sources; not verbatim on Cisco page |
| Passing score | **Not published.** Scaled score 300-1000. Cisco sets the cut score by statistical analysis, subject to change. (~800-850 is *anecdotal only*) | Cisco exam policies |
| Languages | English, Japanese | Cisco exam page |
| Associated course | **Implementing and Administering Cisco Solutions (CCNA)** | Exam-topics PDF |

> **Design takeaway**: the app's **full exam mode** must mimic 120 minutes, a mixed item set including sim/simlet/testlet, and topology/CLI images. Do **not** chase a specific question count or passing score Cisco never published; instead report a per-domain readiness band.

---

## 3. Exam blueprint = the app's content backbone

The six domains and their **exam weights** drive (a) how many questions the full-exam mode draws from each area, and (b) the pre-assessment priority ranking.

| # | Domain | Weight |
|---|---|---|
| 1.0 | Network Fundamentals | **20%** |
| 2.0 | Network Access | **20%** |
| 3.0 | IP Connectivity | **25%** |
| 4.0 | IP Services | **10%** |
| 5.0 | Security Fundamentals | **15%** |
| 6.0 | Automation and Programmability | **10%** |

Full sub-topic list (verbatim from the v1.1 PDF) lives in `content/blueprint.json` - see [Section 9](#9-content-map-domain--resources) for the per-domain study + resource mapping and [Section 10](#10-data-model) for the schema. Source PDF: <https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf>

---

## 4. PWA feature set

| # | Feature | What it does | Priority |
|---|---|---|---|
| 4.1 | **Pre-assessment / diagnostic** | Short adaptive test across all 6 domains. Outputs a per-domain readiness % and a personalized "focus here first" study order. | MVP |
| 4.2 | **Topic study modules** | One module per domain, broken into the blueprint sub-topics. Each card = concept + example + linked Cisco doc + JITS video + Cisco course module. | MVP |
| 4.3 | **Question bank** | Tagged by domain/sub-topic/type/difficulty. **Every option** carries a why-right / why-wrong rationale + source link. | MVP |
| 4.4 | **Labs** | Topology + scenario + tasks + grading rubric + solution. Emulates Sim/Simlet/Testlet. Pairs with free Cisco Packet Tracer files. | MVP |
| 4.5 | **Full exam mode** | 120-min timer, weighted item mix, sims included, locked review until submit, then full rationale review + per-domain score report. | MVP |
| 4.6 | **Image support** | Topology SVGs + CLI exhibit panes + drag-and-drop canvas, like the real exam. | MVP |
| 4.7 | **Progress & analytics** | Per sub-topic mastery, time-on-task, weak-area trend, readiness gauge. Drives the "focus more" engine. | MVP |
| 4.8 | **Spaced repetition / flashcards** | Anki-style review queue (SM-2 style). Mirrors Jeremy's IT Lab free Anki decks. | v2 |
| 4.9 | **Resource panel** | Per topic: deep link to the verified Cisco doc, the matching JITS video group, and the Cisco course module. | MVP |
| 4.10 | **Offline-first PWA shell** | Service worker + manifest + installable. Content bank and progress work offline. | MVP |

---

## 5. Pre-assessment design (detailed)

This is the feature Nuno emphasized: *analyze which topics are important, and where the student should focus more.* It does both, because it combines **exam weight** (importance) with **measured weakness** (focus).

### 5.1 Diagnostic test
- ~30 items, sampled across all 6 domains, proportional to weight (e.g. 6 NetFund, 6 NetAccess, 7-8 IP Connectivity, 3 IP Services, 4-5 Security, 3 Automation).
- Mix of types so the student also discovers which *formats* (sim vs MCQ) they struggle with.
- No time pressure on the diagnostic; the goal is signal, not stress.

### 5.2 Scoring -> readiness band
For each domain `d`: `score(d) = correct(d) / asked(d)` (0 to 1).

| Band | Score | Meaning |
|---|---|---|
| 🔴 Red | < 0.60 | Study from scratch |
| 🟡 Yellow | 0.60 - 0.80 | Reinforce + practice |
| 🟢 Green | > 0.80 | Maintain + spaced review |

Overall readiness = `Σ score(d) × weight(d)` (a single 0-100% gauge).

### 5.3 "Focus more" priority engine
Rank domains by a **priority score** that rewards both *high exam weight* and *low current mastery*:

```
priority(d) = weight(d) × (1 - score(d))
```

Sort descending. The top of the list is where the student gets the most exam points per hour studied. Example: weak IP Connectivity (25% weight) outranks weak IP Services (10% weight) at equal scores. Re-run the diagnostic after each module to re-rank.

### 5.4 Output
A personalized study path: ordered domain list, each expanded into its weak sub-topics, each linking straight to the matching study cards, labs, Cisco doc, and JITS video.

---

## 6. Full exam simulation design

- **120-minute** countdown, single session.
- **Item allocation by weight** (for a ~100-item exam): 20 / 20 / 25 / 10 / 15 / 10 across domains 1-6. Include at least a few **Sim / Simlet / Testlet** items built on topology images and CLI exhibits.
- **Real-exam behavior**: no back-navigation on sims (mirror Cisco), answers locked at submit.
- **Score report**: overall readiness gauge + per-domain breakdown. Do **not** print a fake "pass/fail at 825" - instead show the readiness band and flag domains below target.
- **Review mode**: after submit, walk every item with the full why-right / why-wrong rationale and source links.

---

## 7. Question & lab authoring rules (quality bar)

Every item, no exceptions:
1. Tagged: `domain`, `subtopic`, `type`, `difficulty`.
2. **Per-option rationale**: each option says why it is correct or why it is wrong.
3. **Source link**: at least one verified Cisco doc (Section 9) or Cisco Official Cert Guide page.
4. **Image** where the real exam would have one (topology / CLI exhibit / drag-drop).
5. **Truth check**: device behavior must match Cisco IOS/IOS-XE docs. No "trick" answers that depend on non-Cisco behavior.

> **Legal / ethics (hard rule)**: do **not** copy real Cisco exam questions or screenshots (brain dumps violate Cisco's exam policy and are grounds for de-certification, and the images are copyrighted). Author **original** questions and draw **original** topology diagrams that teach the same objective.

---

## 8. Image strategy (exam-like visuals)

The real exam leans on diagrams and CLI exhibits. The app must too.

| Image kind | How to produce | Where |
|---|---|---|
| Network topology | Hand-drawn **SVG** (routers/switches/PCs icon set), or export from Packet Tracer and trace as SVG | `assets/topo/*.svg` |
| CLI exhibit | Monospace text pane rendered from a stored config/output string (searchable, accessible) | inline `exhibit` field |
| Drag-and-drop | Interactive canvas (HTML5 drag API) with labeled tokens + drop zones | component |
| Lab environment | **Cisco Packet Tracer** (free via Cisco Networking Academy) `.pkt` files, linked per lab | `assets/pt/*.pkt` |

Use an **open icon set** for network devices (or draw your own). Never embed Cisco's copyrighted exam graphics.

---

## 9. Content map: domain -> resources

Each table maps blueprint sub-topics to a **verified Cisco doc**, the **Jeremy's IT Lab (JITS)** coverage, and the **Cisco course module**. All Cisco URLs returned HTTP 200 (browser UA) during research.

> JITS playlist (whole course, "Free CCNA 200-301 Complete Course", 63 "Days" + a Mega Lab capstone, ~120-130 videos):
> <https://www.youtube.com/watch?v=H8W9oMNSuwo&list=PLxbwE86jKRgMpuZuLBivzlM8s2Dk5lXBQ>
> First video confirmed: *"Free CCNA | Network Devices | Day 1 | CCNA 200-301 Complete Course"*.
> Free Anki flashcards + Packet Tracer lab files: <https://jitl.jp/ccna-files> (email signup). Resource hub: <https://www.jeremysitlab.com/ccna-resources/>.
> *Per-video domain mapping below is approximate (Jeremy tags by "Day", not by Cisco domain); use the playlist order.*

### Domain 1.0 - Network Fundamentals (20%)
Sub-topics: 1.1 components (routers, L2/L3 switches, NGFW/IPS, APs, controllers, endpoints, servers, PoE) - 1.2 topology architectures (2-tier, 3-tier, spine-leaf, WAN, SOHO, on-prem/cloud) - 1.3 cabling (SMF/MMF/copper) - 1.4 interface/cable issues - 1.5 TCP vs UDP - 1.6 IPv4 addressing & subnetting - 1.7 private IPv4 - 1.8 IPv6 addressing/prefix - 1.9 IPv6 types - 1.10 verify client IP (Win/Mac/Linux) - 1.11 wireless principles - 1.12 virtualization (VMs/containers/VRFs) - 1.13 switching concepts (MAC learning/aging, flooding, MAC table).

| Topic | Cisco doc (verified) |
|---|---|
| TCP/IP overview | <https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13769-5.html> |
| IPv4 subnetting for new users (classic) | <https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13788-3.html> |
| Configure IPv4 addresses (IOS-XE 17.x) | <https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-addressing/b-ip-addressing/m_config-ipv4-addr-0.html> |
| IPv6 addressing & basic connectivity | <https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-addressing/b-ip-addressing/m_ip6-add-basic-conn-xe.html> |
| Free OSI + subnetting reference charts | <https://learningnetwork.cisco.com/s/question/0D53i00001S5LXyCAN/free-osi-model-and-ipv4-subnetting-reference-charts-available-now> |

JITS: early "Days" (Day 1 Network Devices, OSI/TCP-IP model, interfaces & cables, IPv4/IPv6 addressing & subnetting Days, virtualization). Cisco course modules: *Exploring the Functions of Networking; Introducing the Host-to-Host Communications Model; Introducing LANs; Exploring the TCP/IP Link Layer; Introducing the TCP/IP Internet Layer, IPv4 Addressing and Subnets; Explaining the TCP/IP Transport & Application Layer; Introducing Basic IPv6; Introducing Architectures and Virtualization.*

### Domain 2.0 - Network Access (20%)
Sub-topics: 2.1 VLANs (access/voice, default, inter-VLAN) - 2.2 trunking (802.1Q, native VLAN) - 2.3 CDP/LLDP - 2.4 EtherChannel (LACP) - 2.5 Rapid PVST+ STP (root bridge/port, states/roles, PortFast, root/loop guard, BPDU guard/filter) - 2.6 wireless architectures & AP modes - 2.7 WLAN physical connections (AP, WLC, access/trunk, LAG) - 2.8 device management access (Telnet, SSH, HTTP(S), console, TACACS+/RADIUS, cloud) - 2.9 WLAN GUI config.

| Topic | Cisco doc (verified) |
|---|---|
| VLAN trunks config guide | <https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst1000/software/releases/15_2_7_e/configuration_guides/vlan/b_1527e_vlan_c1000_cg/configuring_vlan_trunks.html> |
| 802.1Q trunking between switches | <https://www.cisco.com/c/en/us/support/docs/switches/catalyst-6000-series-switches/10599-88.html> |
| EtherChannel (Catalyst 9200) | <https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9200/software/release/16-9/configuration_guide/lyr2/b_169_lyr2_9200_cg/b_169_lyr2_9200_cg_chapter_011.html> |
| Spanning Tree Protocol (Catalyst 9200) | <https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9200/software/release/16-12/configuration_guide/lyr2/b_1612_lyr2_9200_cg/configuring_spanning_tree_protocol.html> |
| CDP / LLDP | <https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/lyr2-fwd/cdp-lldp-mac-udld/cdp-lldp-mac-udld-configuration-guide/configure-cdp.html> |
| Wireless WPA3 (Catalyst 9800 WLC) | <https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/17-16/config-guide/b_wl_17_16_cg/m_wpa3.html> |

JITS: switching block (VLANs, trunking/DTP/VTP, STP, EtherChannel) + wireless Days. Cisco course modules: *Introducing LANs; Starting a Switch; Implementing VLANs and Trunks; Building Redundant Switched Topologies; Improving Redundant Switched Topologies with EtherChannel; Explaining Wireless Fundamentals.*

### Domain 3.0 - IP Connectivity (25% - highest weight)
Sub-topics: 3.1 routing table components (protocol code, prefix, mask, next hop, AD, metric, gateway of last resort) - 3.2 forwarding decision (longest match, AD, metric) - 3.3 IPv4/IPv6 static routing (default, network, host, floating) - 3.4 single-area OSPFv2 (adjacencies, point-to-point, broadcast DR/BDR, router ID) - 3.5 FHRP purpose/concepts.

| Topic | Cisco doc (verified) |
|---|---|
| Routing protocol-independent features (static, AD) | <https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-routing/b-ip-routing/m_iri-ip-prot-indep-0.html> |
| OSPFv2 on an interface | <https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ip-routing/b-ip-routing/m_iro-mode-ospfv2.html> |
| FHRP / HSRP (concept) | <https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipapp_fhrp/configuration/xe-3s/fhp-xe-3s-book/fhp-hsrp.html> |
| HSRP (IOS-XE 17.x) | <https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/ntw-servs/b-network-services/m_fhp-hsrp-0.html> |

JITS: routing block (routing fundamentals, static routing, OSPF, FHRP/HSRP Days). Cisco course modules: *Exploring the Functions of Routing; Configuring a Cisco Router; Exploring the Packet Delivery Process; Configuring Static Routing; Routing Between VLANs; Introducing OSPF; Exploring Layer 3 Redundancy.* **This is the heaviest domain - give it the most questions and labs.**

### Domain 4.0 - IP Services (10%)
Sub-topics: 4.1 inside source NAT (static + pools) - 4.2 NTP client/server - 4.3 DHCP & DNS roles - 4.4 SNMP - 4.5 syslog (facilities, severities) - 4.6 DHCP client & relay - 4.7 QoS PHB (classification, marking, queuing, congestion, policing, shaping) - 4.8 SSH remote access - 4.9 TFTP/FTP.

| Topic | Cisco doc (verified) |
|---|---|
| NAT | <https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/lyr3-fwd/nat/nat-configuration-guide/nat.html> |
| NTP | <https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_bsm-time-calendar-set.html> |
| SNMP | <https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/snmp/configuration/xe-16-6/snmp-xe-16-6-book/nm-snmp-cfg-snmp-support.html> |
| Syslog (ESM) | <https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_esm-syslog.html> |
| QoS marking | <https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/qos/b-quality-of-service/m_qos-mrkg.html> |
| SSH (Catalyst 9300) | <https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-12/configuration_guide/sec/b_1712_sec_9300_cg/configuring_secure_shell__ssh_.html> |

JITS: network services block (NAT, DHCP, DNS, NTP, SNMP/Syslog, QoS, SSH Days). Cisco course modules: *Enabling Internet Connectivity (NAT); Introducing QoS; Introducing System Monitoring; Managing Cisco Devices.*

### Domain 5.0 - Security Fundamentals (15%)
Sub-topics: 5.1 key concepts (threats, vulnerabilities, exploits, mitigations) - 5.2 program elements (awareness, training, physical access) - 5.3 local password access control - 5.4 password policy & alternatives (MFA, certs, biometrics) - 5.5 IPsec remote-access & site-to-site VPN - 5.6 ACLs - 5.7 L2 security (DHCP snooping, DAI, port security) - 5.8 AAA - 5.9 wireless security (WPA/WPA2/WPA3) - 5.10 WLAN WPA2 PSK via GUI.

| Topic | Cisco doc (verified) |
|---|---|
| ACL overview | <https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/sec_data_acl/configuration/xe-16-9/sec-data-acl-xe-16-9-book/sec-access-list-ov.html> |
| Dynamic ARP Inspection / DHCP snooping | <https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-9/configuration_guide/sec/b_179_sec_9300_cg/configuring_dynamic_arp_inspection.html> |
| 802.1X / AAA | <https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-3/configuration_guide/sec/b_173_sec_9300_cg/configuring_ieee_802_1x_port_based_authentication.html> |
| IPsec VPN | <https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/sec-vpn/b-security-vpn/m_sec-cfg-vpn-ipsec-0.html> |
| SSH on routers (secure access) | <https://www.cisco.com/c/en/us/support/docs/security-vpn/secure-shell-ssh/4145-ssh.html> |

JITS: security block (ACLs, port security, DHCP snooping, DAI, AAA, VPN concepts Days). Cisco course modules: *Examining the Security Threat Landscape; Implementing Threat Defense Technologies; Securing Administrative Access; Implementing Device Hardening; Explaining Basics of ACL.*

### Domain 6.0 - Automation and Programmability (10%)
Sub-topics: 6.1 automation impact - 6.2 traditional vs controller-based - 6.3 SDN architecture (overlay/underlay/fabric, control vs data plane, NB/SB APIs) - 6.4 AI (generative & predictive) and ML in netops *(new in v1.1)* - 6.5 REST APIs (auth types, CRUD, HTTP verbs, encoding) - 6.6 config management (**Ansible and Terraform** in v1.1) - 6.7 JSON data.

| Topic | Cisco doc (verified) |
|---|---|
| RESTCONF (REST APIs on IOS-XE) | <https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/prog/configuration/1717/b_1717_programmability_cg/m_1717_prog_restconf.html> |
| NETCONF / YANG | <https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/prog/configuration/1717/b_1717_programmability_cg/m_1717_prog_yang_netconf.html> |
| SDN overview | <https://www.cisco.com/c/en/us/solutions/software-defined-networking/overview.html> |
| Catalyst Center (DNA Center) API - DevNet | <https://developer.cisco.com/docs/dna-center/> |
| SD-Access solution overview | <https://www.cisco.com/c/en/us/solutions/collateral/enterprise-networks/software-defined-access/solution-overview-c22-739012.html> |

JITS: final advanced Days (automation, SDN/controller-based, REST APIs, JSON, config-management tools). Cisco course module: *Explaining the Evolution of Intelligent Networks.* **Note v1.1 added 6.4 AI/ML and lists Ansible + Terraform - ensure these cards exist.**

---

## 10. Data model

Keep all content as JSON so a blueprint version bump (v1.1 -> v2.0) is a data change, not a code change.

### `content/blueprint.json`
```json
{
  "examCode": "200-301",
  "version": "1.1",
  "domains": [
    { "id": "1.0", "name": "Network Fundamentals", "weightPct": 20,
      "subtopics": [ { "id": "1.6", "title": "Configure and verify IPv4 addressing and subnetting" } ] }
  ]
}
```

### `content/questions/*.json`
```json
{
  "id": "q-1.6-001",
  "domain": "1.0",
  "subtopic": "1.6",
  "type": "single",
  "difficulty": "medium",
  "stem": "Given 192.168.10.0/26, how many usable hosts per subnet?",
  "image": "assets/topo/q-1.6-001.svg",
  "exhibit": null,
  "options": [
    { "id": "a", "text": "62", "correct": true,
      "rationale": "A /26 leaves 6 host bits: 2^6 - 2 = 62 usable hosts (network + broadcast excluded)." },
    { "id": "b", "text": "64", "correct": false,
      "rationale": "64 is the block size (2^6), not usable hosts. You must subtract network and broadcast addresses." },
    { "id": "c", "text": "30", "correct": false,
      "rationale": "30 corresponds to a /27 (5 host bits), not a /26." }
  ],
  "explanation": "Host bits = 32 - 26 = 6. Usable = 2^6 - 2 = 62.",
  "references": [
    { "label": "Cisco: IP addressing & subnetting for new users",
      "url": "https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13788-3.html" },
    { "label": "JITS - Subnetting Days",
      "url": "https://www.youtube.com/watch?v=H8W9oMNSuwo&list=PLxbwE86jKRgMpuZuLBivzlM8s2Dk5lXBQ" }
  ],
  "tags": ["subnetting", "ipv4"]
}
```

### `content/labs/*.json`
```json
{
  "id": "lab-2.1-001",
  "domain": "2.0",
  "subtopics": ["2.1", "2.2"],
  "title": "Configure VLANs and an 802.1Q trunk across two switches",
  "type": "sim",
  "topologyImage": "assets/topo/lab-2.1-001.svg",
  "scenario": "SW1 and SW2 connect on Gi0/1. Put PC1 in VLAN 10 (DATA), PC2 in VLAN 20 (VOICE), and trunk between switches.",
  "startingConfigs": { "SW1": "hostname SW1\n", "SW2": "hostname SW2\n" },
  "tasks": [
    { "id": 1, "text": "Create VLAN 10 (DATA) and VLAN 20 (VOICE) on both switches", "points": 20 },
    { "id": 2, "text": "Configure Gi0/1 as an 802.1Q trunk on both switches", "points": 20 }
  ],
  "gradingRubric": [
    { "check": "VLAN 10 named DATA exists on SW1", "verifyCmd": "show vlan brief", "points": 10 },
    { "check": "Gi0/1 is trunking with 802.1Q", "verifyCmd": "show interfaces trunk", "points": 10 }
  ],
  "solution": {
    "SW1": "vlan 10\n name DATA\nvlan 20\n name VOICE\ninterface gi0/1\n switchport mode trunk\n switchport trunk encapsulation dot1q",
    "explanation": "VLANs must exist before assignment; trunk carries both VLANs tagged with 802.1Q; native VLAN must match on both ends."
  },
  "references": [
    { "label": "Cisco: Configuring VLAN Trunks",
      "url": "https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst1000/software/releases/15_2_7_e/configuration_guides/vlan/b_1527e_vlan_c1000_cg/configuring_vlan_trunks.html" }
  ],
  "packetTracerFile": "assets/pt/lab-2.1-001.pkt"
}
```

### `progress` (per user, IndexedDB)
```json
{
  "diagnostic": { "1.0": 0.7, "2.0": 0.5, "3.0": 0.4, "4.0": 0.8, "5.0": 0.6, "6.0": 0.9 },
  "priority": ["3.0", "2.0", "5.0", "1.0", "4.0", "6.0"],
  "subtopicMastery": { "1.6": 0.9, "3.4": 0.3 },
  "examAttempts": [ { "date": "2026-06-15", "overall": 0.82, "byDomain": { "3.0": 0.7 } } ]
}
```

---

## 11. Tech stack (recommendation)

MVP can be **fully static + client-side** - no backend needed.

| Layer | Choice | Why |
|---|---|---|
| Shell | PWA: `manifest.json` + service worker (Workbox) | Installable, offline, "like an app" |
| Framework | Svelte or vanilla TS (lightweight) or React if preferred | Small bundle, fast on mobile |
| Storage | **IndexedDB** for question bank + progress; cache API for assets | Works offline, no server |
| Content | JSON files (Section 10), bundled or fetched + cached | Version-swappable, no DB server |
| Images | SVG topologies + text CLI exhibits | Scalable, accessible, tiny |
| Labs | Link out to **Cisco Packet Tracer** `.pkt` files | Real CLI practice, free |
| Optional later | Backend for cross-device sync, leaderboard | Only if needed |

---

## 12. Roadmap

**Phase 1 - MVP (pass-the-exam core)**
- `blueprint.json` loaded as data (all 6 domains, every sub-topic).
- Diagnostic engine + priority ranking (Section 5).
- Question bank with per-option rationales + source links (start: 25-30 questions/domain).
- 2-3 labs per domain with topology SVG + rubric + solution.
- Full exam mode (120-min timer, weighted mix, score report + review).
- Resource panel (verified Cisco docs + JITS + Cisco course module per topic).
- PWA shell (offline, installable).

**Phase 2 - depth**
- Spaced-repetition flashcards (SM-2), mirroring JITS Anki decks.
- Sim/Simlet/Testlet interactive components (drag-drop, multi-part testlets).
- Grow bank to 60+ questions/domain; add hard-tier items.

**Phase 3 - polish & future-proof**
- Analytics dashboard + study-time tracking.
- v2.0 blueprint package (ready for 03 Feb 2027 exam switch).
- Optional account sync.

---

## 13. Master resource list (all verified HTTP 200)

**Official Cisco - exam & course**
- Exam page (200-301): <https://www.cisco.com/c/en/us/training-events/training-certifications/exams/current-list/ccna-200-301.html>
- Exam topics PDF (v1.1): <https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf>
- Exam topics PDF (v2.0, live 03 Feb 2027): <https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf>
- **Cisco course Nuno bought** - "Implementing and Administering Cisco Solutions (CCNA)" e-learning (v2.2, product `CSCU-LP-CCNA-V2-029229`): <https://learningnetworkstore.cisco.com/on-demand-e-learning/implementing-and-administering-cisco-solutions-ccna-v2.2/CSCU-LP-CCNA-V2-029229.html> (redirects to Cisco U. path 248). Datasheet PDF: <https://www.cisco.com/c/dam/en_us/training-events/training-services/courses/implementing-and-administering-cisco-solutions-ccna.pdf>

**Jeremy's IT Lab (JITS)**
- Free CCNA playlist: <https://www.youtube.com/watch?v=H8W9oMNSuwo&list=PLxbwE86jKRgMpuZuLBivzlM8s2Dk5lXBQ>
- Free Anki + Packet Tracer labs (email signup): <https://jitl.jp/ccna-files>
- Resource hub: <https://www.jeremysitlab.com/ccna-resources/>
- Full paid course: <https://courses.jeremysitlab.com/p/ccna>

**Cisco config docs** - see the per-domain tables in [Section 9](#9-content-map-domain--resources).

**Recommended supplementary materials (named; verify the seller link before purchase)**
- *Cisco CCNA 200-301 Official Cert Guide* (Wendell Odom, Cisco Press) - the canonical book.
- *Cisco Packet Tracer* (free, via Cisco Networking Academy) - lab simulator.
- *Boson ExSim-Max for 200-301* - well-regarded paid practice exams.

> These three are deliberately listed by name without auto-verified links because their store URLs change. Confirm the current official page before linking in-app.

---

## 14. Appendix - link verification log

- Method: each Cisco URL fetched with a browser user-agent (`curl -A "<Chrome UA>" -L`), recording the HTTP status. Re-tested any `403` after a delay.
- Result: **every Cisco documentation URL in this plan returned HTTP 200.** The transient `403`s seen by automated bots are Cisco's CDN (Akamai) bot-protection, not missing pages.
- Confirmed reachable independently of bot-block: Cisco Learning Network charts post, HSRP guides, Catalyst 9300 SSH guide, DevNet Catalyst Center API, the JITS playlist (first video title confirmed), `jitl.jp/ccna-files`, the v1.1 exam-topics PDF, and the Cisco exam page.
- Not text-extractable by bots (but valid for humans): the Cisco Learning Network Store product page (JS-rendered; redirects to Cisco U. path 248) and the marketing course landing page.

**Unverifiable / flagged claims (kept honest)**
- Exact number of exam questions: **not published by Cisco**.
- Passing score: **not published by Cisco** (scaled 300-1000; ~800-850 is community anecdote only).
- JITS total video count (~120-130) and per-domain video grouping: **approximate** (course is officially 63 "Days" + Mega Lab; Jeremy tags by Day, not Cisco domain).
- Cisco course module/lab outline: taken from the **v1.0 datasheet**; the e-learning sold today is **v2.2** (content refreshed, structure broadly the same).
