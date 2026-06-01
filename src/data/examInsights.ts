// What to expect on the real CCNA 200-301 exam per domain.
// Source: official Cisco exam blueprint v1.1 topics + CCNA community consensus.
// No real exam questions reproduced. All guidance is original and derived from
// publicly available topic lists and Cisco documentation.

export interface DomainInsight {
  summary: string;
  questionTypes: string[];
  hotTopics: string[];
  tips: string[];
}

export const examInsights: Record<string, DomainInsight> = {
  "1.0": {
    summary:
      "Network Fundamentals covers the OSI and TCP/IP models, IP addressing, subnetting, and how devices such as routers, switches, and access points function. Roughly 20% of the exam. Subnetting calculation questions appear frequently.",
    questionTypes: [
      "Single-answer: identify OSI layer functions",
      "Single-answer: calculate subnet hosts or network address",
      "Multi-select: features of TCP vs UDP",
      "Drag-and-drop: match protocol to port number or OSI layer",
    ],
    hotTopics: [
      "Subnetting: /24 to /30, number of hosts, network/broadcast address",
      "CIDR and VLSM notation",
      "OSI model: layer names and what runs at each layer",
      "TCP three-way handshake vs UDP connectionless delivery",
      "IPv6 address types: global unicast, link-local, multicast",
      "Private vs public address ranges (RFC 1918)",
      "PoE standards: 802.3af (15.4 W), 802.3at (30 W), 802.3bt (60-100 W)",
    ],
    tips: [
      "Memorise the 7 OSI layers and 4 TCP/IP layers cold.",
      "Practice subnetting until you can work a /26 or /27 in under 30 seconds.",
      "Know which protocols use TCP vs UDP (DNS uses both; DHCP, TFTP = UDP; HTTP, FTP, SSH = TCP).",
      "IPv6 EUI-64 derivation often appears: flip bit 7 of the MAC, insert FF:FE in the middle.",
    ],
  },
  "2.0": {
    summary:
      "Network Access covers Layer 2 switching, VLANs, 802.1Q trunking, STP, EtherChannel, and wireless fundamentals. Roughly 20% of the exam. Expect multiple configuration-style questions on VLANs and spanning tree.",
    questionTypes: [
      "Single-answer: identify STP port states or bridge election",
      "Multi-select: correct 802.1Q trunk statements",
      "Drag-and-drop: match STP role to port description",
      "Exhibit: read show spanning-tree output and identify root bridge or blocking port",
    ],
    hotTopics: [
      "VLAN creation and assignment, native VLAN, voice VLAN",
      "802.1Q trunk: allowed VLANs, native VLAN mismatch security risk",
      "STP: root bridge election (lowest BID), port roles (root, designated, alternate), port states",
      "Rapid PVST+ vs legacy STP convergence times",
      "PortFast and BPDU Guard: purpose and configuration",
      "EtherChannel: LACP vs PAgP, load-balancing modes",
      "Wireless: 802.11 standards (a/b/g/n/ac/ax), 2.4 GHz vs 5 GHz, non-overlapping channels",
      "WPA2 vs WPA3: authentication modes",
    ],
    tips: [
      "Know the STP root bridge election rule: lowest bridge ID wins (priority first, then MAC).",
      "Remember: native VLAN must match on both ends of a trunk or traffic is misrouted.",
      "PortFast skips Listening/Learning; BPDU Guard shuts the port if a BPDU is received.",
      "LACP is IEEE (open), PAgP is Cisco-proprietary.",
    ],
  },
  "3.0": {
    summary:
      "IP Connectivity is the heaviest domain at 25%. It covers IPv4/IPv6 routing, static routes, OSPFv2, and the routing table. Expect a large number of questions; OSPF configuration and verification are a major focus.",
    questionTypes: [
      "Single-answer: identify best path from a routing table exhibit",
      "Multi-select: correct statements about OSPF neighbour requirements",
      "Exhibit: read show ip route or show ip ospf neighbor and interpret state",
      "Drag-and-drop: match administrative distance to routing source",
    ],
    hotTopics: [
      "Static routes: next-hop vs exit-interface, floating static (AD > 110)",
      "Default route: ip route 0.0.0.0 0.0.0.0",
      "OSPF: router-id election, neighbour states (Down→Init→2-Way→ExStart→Exchange→Loading→Full)",
      "OSPF: DR/BDR election on multi-access segments",
      "OSPF: cost = 10^8 / bandwidth; default reference bandwidth 100 Mbps",
      "Administrative distance: connected=0, static=1, eBGP=20, OSPF=110, RIP=120",
      "IPv6 static routes and OSPFv3 basics",
      "Longest-prefix match rule for routing decisions",
    ],
    tips: [
      "The exam loves OSPF neighbour troubleshooting: mismatched area ID, Hello/Dead timers, or subnet mismatch prevent adjacency.",
      "Know administrative distance numbers by heart - they appear in almost every routing table question.",
      "A Full OSPF state means the routers have exchanged LSDBs and can route traffic.",
      "Default route redistribution into OSPF: default-information originate.",
    ],
  },
  "4.0": {
    summary:
      "IP Services covers DHCP, NAT/PAT, NTP, SNMP, Syslog, SSH, TFTP, and DNS. At 10% of the exam, these are often scenario-based questions on configuration or verification commands.",
    questionTypes: [
      "Single-answer: identify correct NAT translation table entry",
      "Single-answer: which command enables DHCP snooping",
      "Multi-select: correct Syslog severity levels",
      "Exhibit: read show ip nat translations and identify inside/outside addresses",
    ],
    hotTopics: [
      "DHCP: DORA process (Discover, Offer, Request, Ack), ip helper-address for relay",
      "NAT types: static, dynamic, PAT (overload)",
      "Inside local, inside global, outside local, outside global definitions",
      "NTP: stratum levels, client/server mode, authentication",
      "SNMP: v2c (community string) vs v3 (auth + encryption), OID, trap vs inform",
      "Syslog severity levels 0-7 (Emergency to Debug)",
      "SSH vs Telnet: SSH encrypted on TCP 22, Telnet cleartext on TCP 23",
      "TFTP vs FTP: TFTP = UDP 69 (simple, no auth); FTP = TCP 20/21",
    ],
    tips: [
      "NAT inside local = private address before translation; inside global = public address after.",
      "Syslog level 0 = Emergency (most critical), level 7 = Debug (most verbose). Lower = worse.",
      "ip dhcp excluded-address reserves addresses so DHCP will not assign them.",
      "SNMP v3 is the only version with confidentiality (encryption) - expect a question on this.",
    ],
  },
  "5.0": {
    summary:
      "Security Fundamentals covers ACLs, device hardening, VPN concepts, and AAA. At 15% of the exam, ACL syntax and placement are frequent question topics.",
    questionTypes: [
      "Single-answer: identify ACL placement (inbound vs outbound, closest to source/destination)",
      "Exhibit: read ACL and determine if a packet is permitted or denied",
      "Multi-select: correct statements about standard vs extended ACLs",
      "Single-answer: purpose of DHCP snooping or Dynamic ARP Inspection",
    ],
    hotTopics: [
      "Standard ACL (1-99, 1300-1999): matches source IP only; place close to destination",
      "Extended ACL (100-199, 2000-2699): matches source+destination+protocol+port; place close to source",
      "Named ACLs: ip access-list extended NAME; allow editing individual entries",
      "Implicit deny any at the end of every ACL",
      "DHCP snooping: blocks rogue DHCP servers, builds snooping binding table",
      "Dynamic ARP Inspection (DAI): validates ARP against the snooping table",
      "Port security: max MAC addresses, violation modes (protect, restrict, shutdown)",
      "AAA: Authentication, Authorisation, Accounting; RADIUS vs TACACS+",
      "IPsec VPN concepts: site-to-site vs remote-access, IKE phase 1/2",
    ],
    tips: [
      "Extended ACLs go near the SOURCE; standard ACLs go near the DESTINATION - this is the #1 ACL rule.",
      "ACL wildcard mask: 0 bits = must match, 1 bits = don't care. 0.0.0.255 matches any host in /24.",
      "TACACS+ separates AAA functions and uses TCP; RADIUS combines auth+authorisation and uses UDP.",
      "A missing ACL entry = implicit deny. Test connectivity before applying ACLs to production.",
    ],
  },
  "6.0": {
    summary:
      "Automation and Programmability covers REST APIs, JSON/YAML, Ansible/Puppet/Chef, Cisco DNA Center, and the difference between traditional CLI and controller-based networking. At 10% of the exam, expect more conceptual questions than hands-on config.",
    questionTypes: [
      "Single-answer: identify HTTP method (GET/POST/PUT/DELETE/PATCH) for a given action",
      "Single-answer: which tool uses push vs pull model",
      "Exhibit: read a JSON payload and identify a value",
      "Multi-select: correct statements about SDN or controller-based networking",
    ],
    hotTopics: [
      "REST API: HTTP methods GET (read), POST (create), PUT (replace), PATCH (update), DELETE",
      "HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found",
      "JSON structure: key-value pairs, arrays [], objects {}",
      "YANG data models and NETCONF/RESTCONF protocols",
      "Ansible (agentless, YAML, push), Puppet (agent-based, pull), Chef (agent-based, pull)",
      "Cisco DNA Center: intent-based networking, southbound/northbound APIs",
      "SDN planes: data plane (forwarding), control plane (routing decisions), management plane",
      "Traditional vs controller-based: configuration pushed by controller, not per-device CLI",
    ],
    tips: [
      "REST APIs are stateless: each request contains all information needed; no session state kept.",
      "JSON is the dominant format for Cisco APIs; YAML is common for Ansible playbooks.",
      "Ansible is agentless - it uses SSH to push config, no agent installed on target devices.",
      "DNA Center uses HTTPS REST to the northbound and protocols like NETCONF to the southbound.",
    ],
  },
};
