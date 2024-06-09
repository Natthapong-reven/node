#include "net_permission.h"
#include "debug_utils-inl.h"
#include "json_utils.h"
#include "util.h"

#include <string>
#include <string_view>
#include <vector>

namespace node {

namespace permission {

void NetPermission::Apply(Environment* env,
                          const std::vector<std::string>& allow,
                          PermissionScope scope) {
  if (allow_all_udp_in_ && allow_all_udp_out_) {
    return;
  }
  // For Debug
  auto cleanup = OnScopeLeave([&]() { Print(); });
  using std::string_view_literals::operator""sv;
  for (const std::string& res : allow) {
    const std::vector<std::string_view> addresses = SplitString(res, ","sv);
    for (const auto& address : addresses) {
      // address is like *, */*, host, host/*, host/port, */port
      if (address != "*"sv && address != "*/*"sv) {
        GrantAccess(scope, address);
        continue;
      }
      switch (scope) {
        case PermissionScope::kNetUDP:
          deny_all_udp_in_ = false;
          allow_all_udp_in_ = true;
          deny_all_udp_out_ = false;
          allow_all_udp_out_ = true;
          granted_net_udp_in_.clear();
          granted_net_udp_out_.clear();
          return;
        case PermissionScope::kNetUDPIn:
          deny_all_udp_in_ = false;
          allow_all_udp_in_ = true;
          granted_net_udp_in_.clear();
          return;
        case PermissionScope::kNetUDPOut:
          deny_all_udp_out_ = false;
          allow_all_udp_out_ = true;
          granted_net_udp_out_.clear();
          return;
        default:
          UNREACHABLE();
      }
    }
  }
}

void NetPermission::GrantAccess(PermissionScope scope,
                                const std::string_view& param) {
  using std::string_view_literals::operator""sv;
  const std::vector<std::string_view> result = SplitString(param, "/"sv);
  int len = result.size();
  CHECK(len == 1 || len == 2);
  std::string host_or_ip;
  std::string port;
  // --allow-net-udp[-in|out]=host
  if (len == 1) {
    host_or_ip = result[0];
    port = "*";
  } else {  // --allow-net-udp[-in|out]=[host/port|host/*|*/port]
    host_or_ip = result[0];
    port = result[1];
  }
  auto fn = [&](address_map* rules) {
    auto iter = rules->find(host_or_ip);
    if (iter == rules->end()) {
      rules->insert(
          std::pair<std::string, std::vector<std::string>>(host_or_ip, {port}));
    } else {
      // we do not need to handle other ports if port(iter->second[0]) is equal
      // to *
      if (iter->second[0] != "*") {
        // clear all the old ports if the new port is equal to *
        if (port == "*") {
          iter->second.clear();
          iter->second.push_back(port);
        } else if (std::find(iter->second.begin(), iter->second.end(), port) ==
                   iter->second.end()) {
          // insert the port if it does not exsit
          iter->second.push_back(port);
        }
      }
    }
  };
  if (scope == PermissionScope::kNetUDP ||
      scope == PermissionScope::kNetUDPIn) {
    fn(&granted_net_udp_in_);
    deny_all_udp_in_ = false;
  }
  if (scope == PermissionScope::kNetUDP ||
      scope == PermissionScope::kNetUDPOut) {
    fn(&granted_net_udp_out_);
    deny_all_udp_out_ = false;
  }
}

void NetPermission::Print() const {
  if (UNLIKELY(per_process::enabled_debug_list.enabled(
          DebugCategory::PERMISSION_MODEL))) {
    auto fn = [&](const address_map* rules) {
      JSONWriter writer(std::cout, false);
      writer.json_start();
      for (const auto& iter : *rules) {
        writer.json_keyvalue("host_or_ip", iter.first);
        writer.json_arraystart("port");
        for (const auto& port : iter.second) {
          writer.json_element(port);
        }
        writer.json_arrayend();
      }
      writer.json_end();
      std::cout << std::endl << std::endl;
    };
    std::cout << "net-udp-net-in: " << std::endl;
    std::cout << "  deny_all_udp_in_: " << deny_all_udp_in_ << std::endl;
    std::cout << "  allow_all_udp_in_: " << allow_all_udp_in_ << std::endl;
    fn(&granted_net_udp_in_);
    std::cout << "net-udp-net-out: " << std::endl;
    std::cout << "  deny_all_udp_out_: " << deny_all_udp_out_ << std::endl;
    std::cout << "  allow_all_udp_out_: " << allow_all_udp_out_ << std::endl;
    fn(&granted_net_udp_out_);
  }
}

bool NetPermission::is_granted(Environment* env,
                               PermissionScope perm,
                               const std::string_view& param = "") const {
  switch (perm) {
    case PermissionScope::kNetUDP:
      return allow_all_udp_in_ && allow_all_udp_out_;
    case PermissionScope::kNetUDPIn:
      return !deny_all_udp_in_ &&
             (allow_all_udp_in_ ||
              check_permission(&granted_net_udp_in_, param));
    case PermissionScope::kNetUDPOut:
      return !deny_all_udp_out_ &&
             (allow_all_udp_out_ ||
              check_permission(&granted_net_udp_out_, param));
    default:
      return false;
  }
}

bool NetPermission::check_permission(const address_map* rules,
                                     const std::string_view& param) const {
  if (param.empty()) {
    return false;
  }
  using std::string_view_literals::operator""sv;
  std::string host;
  std::string port;
  const std::vector<std::string_view> result = SplitString(param, "/"sv);
  if (result.size() == 1) {
    host = result[0];
    port = "*";
  } else {
    host = result[0];
    port = result[1];
  }
  auto fn = [&](auto iter) {
    if (iter->second[0] == "*") {
      return true;
    }
    if (std::find(iter->second.begin(), iter->second.end(), port) !=
        iter->second.end()) {
      return true;
    }
    return false;
  };
  auto iter = rules->find(host);
  if (iter != rules->end() && fn(iter)) {
    return true;
  }
  if (host != "*") {
    iter = rules->find("*");
    if (iter != rules->end() && fn(iter)) {
      return true;
    }
  }
  return false;
}

}  // namespace permission
}  // namespace node
